import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { newLinkToken, subscriptionAllows, nextStatus, type SubStatus } from "./subscription";

const now = () => Date.now();

// Historial para el reporte de churn. Solo se registra cuando el estado cambia:
// los webhooks de Reveniu llegan repetidos y los duplicados inflarían las métricas.
const logEvent = (
  ctx: MutationCtx,
  email: string,
  status: SubStatus | "deleted",
  motivo?: { cancelReason?: string; feedback?: string },
) => ctx.db.insert("subscriptionEvents", { email, status, at: now(), ...motivo });

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("ending"),
  v.literal("cancelled"),
);

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: (ctx, { email }) =>
    ctx.db.query("subscriptions").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

// Query de ruta caliente para el gate del chat.
export const isActiveByChat = internalQuery({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .unique();
    return subscriptionAllows(sub);
  },
});

// Historial completo para el reporte de churn.
// ponytail: scan completo de la tabla; a este volumen (un evento por cambio de estado) es
// trivial. Paginar por rango de fechas con el índice by_at si pasa las ~10k filas.
export const eventsAll = internalQuery({
  args: {},
  handler: (ctx) => ctx.db.query("subscriptionEvents").withIndex("by_at").collect(),
});

// Backfill de un solo uso, para correr a mano una vez (`npx convex run subscriptions:backfillEvents`
// o desde el dashboard). `subscriptionEvents` es posterior a las primeras suscripciones: la cohorte
// que ya existía tiene cero eventos, y como churnMensual solo cuenta una baja de quien entró al set
// con un "active", esas suscripciones no aparecen ni al alta ni a la baja — el panel mostraría 0%.
// Idempotente: si el email ya tiene historial se salta, así correrla dos veces no duplica nada.
export const backfillEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    let creados = 0;
    for (const s of await ctx.db.query("subscriptions").collect()) {
      const previo = await ctx.db
        .query("subscriptionEvents")
        .withIndex("by_email", (q) => q.eq("email", s.email))
        .first();
      if (previo) continue;
      await ctx.db.insert("subscriptionEvents", { email: s.email, status: s.status, at: s.createdAt });
      creados++;
    }
    return { creados };
  },
});

// Crea (o resetea a pending) la suscripción de un email y le da un token de enlace nuevo.
export const createPending = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const linkToken = newLinkToken();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "pending", linkToken, updatedAt: now() });
      if (existing.status !== "pending") await logEvent(ctx, email, "pending");
      return { id: existing._id, linkToken };
    }
    const id = await ctx.db.insert("subscriptions", {
      email,
      status: "pending",
      linkToken,
      createdAt: now(),
      updatedAt: now(),
    });
    await logEvent(ctx, email, "pending");
    return { id, linkToken };
  },
});

// Guarda el id de Reveniu apenas se crea la suscripción allá, para que el webhook pueda
// resolver la fila por índice.
export const setReveniuId = internalMutation({
  args: { subId: v.id("subscriptions"), reveniuId: v.number() },
  handler: (ctx, { subId, reveniuId }) =>
    ctx.db.patch(subId, { reveniuId, updatedAt: now() }),
});

// Webhook: aplica un evento de Reveniu a la suscripción que corresponda.
// Resuelve primero por reveniuId (lo escribimos nosotros, es la vía autoritativa) y cae al
// externalId — nuestro propio _id — para cubrir un caso real: el usuario abandona un
// checkout, empieza otro (lo que sobreescribe reveniuId) y después completa la pestaña
// vieja. Sin el fallback esa persona paga y no recibe nada.
export const applyReveniuEvent = internalMutation({
  args: {
    event: v.string(),
    reveniuId: v.number(),
    externalId: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, { event, reveniuId, externalId, cancelReason, feedback }) => {
    let sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_reveniu", (q) => q.eq("reveniuId", reveniuId))
      .unique();

    if (!sub && externalId) {
      // normalizeId devuelve null si el string no es un Id de esta tabla — protege de que
      // Reveniu nos devuelva el external_id transformado (su doc lo tipa como integer).
      const id = ctx.db.normalizeId("subscriptions", externalId);
      if (id) sub = await ctx.db.get(id);
    }
    if (!sub) return false;

    const status = nextStatus(event, sub.status);
    if (status === null) return true; // evento conocido que no mueve el estado

    await ctx.db.patch(sub._id, { status, reveniuId, updatedAt: now() });
    if (sub.status !== status) {
      await logEvent(ctx, sub.email, status, { cancelReason, feedback });
    }
    return true;
  },
});

// Enlaza un chatId de Telegram a la suscripción vía token de un solo uso.
export const linkChat = internalMutation({
  args: { linkToken: v.string(), chatId: v.number() },
  handler: async (ctx, { linkToken, chatId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_token", (q) => q.eq("linkToken", linkToken))
      .unique();
    if (!sub) return false;
    // Mantener el índice by_chat único: desvincula cualquier otra suscripción que ya
    // tenga este chatId (re-checkout con otro email, regalo, segundo intento). Sin esto,
    // isActiveByChat().unique() reventaría y bloquearía el gate de un usuario que paga.
    const prev = await ctx.db
      .query("subscriptions")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();
    await Promise.all(
      prev
        .filter((p) => p._id !== sub._id)
        .map((p) => ctx.db.patch(p._id, { chatId: undefined, updatedAt: now() })),
    );
    await ctx.db.patch(sub._id, { chatId, linkToken: undefined, updatedAt: now() });
    return true;
  },
});

// Cambia el estado interno por email (cancel/reactivate). El cambio en
// Reveniu lo hace la httpAction antes de llamar esto.
export const setStatusByEmail = internalMutation({
  args: { email: v.string(), status: statusValidator },
  handler: async (ctx, { email, status }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!sub) return;
    await ctx.db.patch(sub._id, { status, updatedAt: now() });
    if (sub.status !== status) await logEvent(ctx, email, status);
  },
});

// Supresión Ley 21.719: borra la suscripción + TODO el rastro del chat en una sola operación.
export const suppressByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // La cuenta web (email + nombre) es rastro personal: se borra aunque nunca haya
    // habido suscripción. Deja al usuario sin login — es lo que pidió al borrar todo.
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (user) await ctx.db.delete(user._id);

    // El historial sobrevive a la supresión, pero no la identidad: se seudonimiza con un
    // token opaco (Ley 21.719). El token es nuevo en cada supresión, así que este ciclo de
    // vida queda correlacionado consigo mismo — suficiente para el churn — y desligado de
    // cualquier otro del mismo email: es a propósito, re-identificar sería el bug.
    // Va antes del early-return a propósito: si alguna vez hay eventos sin fila de
    // suscripción, el email quedaría en claro en la única tabla que sobrevive al borrado.
    const past = await ctx.db
      .query("subscriptionEvents")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (past.length > 0) {
      const anon = `anon:${newLinkToken()}`;
      await Promise.all(past.map((e) => ctx.db.patch(e._id, { email: anon })));
      await logEvent(ctx, anon, "deleted");
    }

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!sub) return { chatId: null, reveniuId: null };
    // ponytail: solo se borra el chat que esta suscripción tiene vinculado *ahora*. Si el
    // usuario compartió su chat de Telegram con otra cuenta, linkChat le quitó el chatId a
    // la suscripción anterior y esos `messages` quedan huérfanos, sin email que los alcance.
    // Requiere dos cuentas sobre un mismo chat; el arreglo real es ambiguo (borrar ese chat
    // afectaría al otro usuario), así que se documenta en vez de adivinar.
    const chatId = sub.chatId ?? null;
    if (chatId !== null) {
      for (const table of ["messages", "consent", "conversations"] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .collect();
        await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
      }
    }
    const reveniuId = sub.reveniuId ?? null;
    await ctx.db.delete(sub._id);
    return { chatId, reveniuId };
  },
});
