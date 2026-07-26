import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { newLinkToken, mapPreapprovalStatus, subscriptionAllows, type SubStatus } from "./subscription";
import type { MpStatus } from "./mercadopago";

const now = () => Date.now();

// Historial para el reporte de churn. Solo se registra cuando el estado cambia:
// el webhook de MercadoPago puede repetirse y los duplicados inflarían las métricas.
const logEvent = (ctx: MutationCtx, email: string, status: SubStatus | "deleted") =>
  ctx.db.insert("subscriptionEvents", { email, status, at: now() });

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("paused"),
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

// Webhook: aplica el estado real de MercadoPago a una suscripción (localizada por _id).
export const applyPreapproval = internalMutation({
  args: { subId: v.id("subscriptions"), mpPreapprovalId: v.string(), mpStatus: v.string() },
  handler: async (ctx, { subId, mpPreapprovalId, mpStatus }) => {
    const sub = await ctx.db.get(subId);
    if (!sub) return;
    const status = mapPreapprovalStatus(mpStatus as MpStatus);
    await ctx.db.patch(subId, { mpPreapprovalId, status, updatedAt: now() });
    if (sub.status !== status) await logEvent(ctx, sub.email, status);
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

// Cambia el estado interno por email (pause/cancel/reactivate). El cambio en
// MercadoPago lo hace la httpAction antes de llamar esto.
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
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!sub) return { chatId: null, mpPreapprovalId: null };
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
    const mpPreapprovalId = sub.mpPreapprovalId ?? null;
    await ctx.db.delete(sub._id);

    // El historial sobrevive a la supresión, pero no la identidad: se seudonimiza con un
    // token opaco (Ley 21.719). Único y estable por usuario, así el churn sigue midiendo
    // bien — las transiciones pasadas quedan correlacionadas entre sí y con el "deleted".
    const anon = `anon:${newLinkToken()}`;
    const past = await ctx.db
      .query("subscriptionEvents")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    await Promise.all(past.map((e) => ctx.db.patch(e._id, { email: anon })));
    await logEvent(ctx, anon, "deleted");
    return { chatId, mpPreapprovalId };
  },
});
