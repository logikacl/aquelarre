import { httpAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { createSubscription, disableRenew, disable } from "./reveniu";
import type { SubStatus } from "./subscription";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): Response | null {
  if (req.headers.get("X-Web-Api-Secret") !== process.env.WEB_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// El re-checkout de alguien que ya paga crearía una segunda suscripción viva en Reveniu:
// dos cobros mensuales al mismo usuario. Es camino de dinero, se corta acá.
export function yaTieneSuscripcion(sub: { status: string } | null | undefined): boolean {
  return sub?.status === "active" || sub?.status === "ending";
}

// POST /api/checkout { email, name } → { completionUrl, securityToken, linkToken }
//                                    | { alreadyActive: true }
// Crea la suscripción pendiente y la suscripción en Reveniu (precio desde settings).
export const checkout = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, name } = await req.json();
  if (typeof email !== "string" || !email.includes("@")) return json({ error: "email inválido" }, 400);

  const actual = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  // 200 y no 409 a propósito: el front lo trata como una bifurcación normal ("andá a tu
  // cuenta"), no como un error que backendPost tendría que hacer throw y parsear.
  if (yaTieneSuscripcion(actual)) return json({ alreadyActive: true });

  const config = await ctx.runQuery(internal.settings.getSubscriptionConfig, {});
  const { id, linkToken } = await ctx.runMutation(internal.subscriptions.createPending, { email });
  const sub = await createSubscription({
    email,
    name: typeof name === "string" && name ? name : email,
    amountClp: config.priceClp,
    externalId: id,
  });
  await ctx.runMutation(internal.subscriptions.setReveniuId, { subId: id, reveniuId: sub.id });
  return json({ completionUrl: sub.completionUrl, securityToken: sub.securityToken, linkToken });
});

// POST /api/subscription { email } → { status, chatId, linkToken }
export const subscription = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub) return json({ status: "none" });
  return json({ status: sub.status, chatId: sub.chatId ?? null, linkToken: sub.linkToken ?? null });
});

// `op` como string y no la función misma para que webapi.check.ts pueda verificar el mapa
// sin tocar la red.
export const ACTIONS = new Map<string, { op: "disablerenew" | "disable"; internal: SubStatus }>([
  ["no_renovar", { op: "disablerenew", internal: "ending" }],
  ["cancel", { op: "disable", internal: "cancelled" }],
]);

// Aplica la acción en Reveniu + la refleja en Convex. Vive aquí y no en la httpAction
// porque el admin hace exactamente lo mismo con otro guard: es camino de dinero, un solo
// lugar. Devuelve el resultado y cada llamador arma su Response.
export async function applySubscriptionAction(
  ctx: ActionCtx,
  email: string,
  action: string,
): Promise<{ ok: true; status: SubStatus } | { ok: false; error: string; code: number }> {
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub?.reveniuId) return { ok: false, error: "sin suscripción activa", code: 404 };
  const m = ACTIONS.get(action);
  if (!m) return { ok: false, error: "acción inválida", code: 400 };

  await (m.op === "disablerenew" ? disableRenew : disable)(sub.reveniuId);
  await ctx.runMutation(internal.subscriptions.setStatusByEmail, { email, status: m.internal });
  return { ok: true, status: m.internal };
}

// Supresión Ley 21.719: borra el rastro local y corta el cobro en Reveniu.
export async function suppressSubscription(ctx: ActionCtx, email: string) {
  const { reveniuId } = await ctx.runMutation(internal.subscriptions.suppressByEmail, { email });
  if (reveniuId) {
    try {
      await disable(reveniuId);
    } catch {
      // ponytail: el dato local ya se borró; reintento manual si Reveniu falla.
    }
  }
}

// POST /api/subscription/action { email, action: "no_renovar"|"cancel" } → { status }
export const subscriptionAction = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, action } = await req.json();
  const r = await applySubscriptionAction(ctx, email, action);
  return r.ok ? json({ status: r.status }) : json({ error: r.error }, r.code);
});

// POST /api/subscription/delete { email } → { deleted: true } (supresión Ley 21.719)
export const subscriptionDelete = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  await suppressSubscription(ctx, email);
  return json({ deleted: true });
});

// POST /reveniu (webhook). Reveniu manda nuestro propio secreto en el header: sin eso,
// cualquiera podría activarle la suscripción a quien quisiera.
export const reveniuWebhook = httpAction(async (ctx, req) => {
  if (req.headers.get("Reveniu-Secret-Key") !== process.env.REVENIU_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const event = body?.event;
  const d = body?.data;
  if (typeof event !== "string" || typeof d?.subscription_id !== "number") {
    return new Response(null, { status: 200 }); // payload que no entendemos: no reintentar
  }
  await ctx.runMutation(internal.subscriptions.applyReveniuEvent, {
    event,
    reveniuId: d.subscription_id,
    externalId: d.subscription_external_id ?? undefined,
    cancelReason: d.cancel_reason ?? undefined,
    feedback: d.feedback ?? undefined,
  });
  // 200 aunque no hayamos encontrado la fila: reintentar no ayudaría y solo llenaría su cola.
  return new Response(null, { status: 200 });
});
