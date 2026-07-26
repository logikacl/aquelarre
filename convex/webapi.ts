import { httpAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { createPreapproval, getPreapproval, setPreapprovalStatus } from "./mercadopago";
import type { SubStatus } from "./subscription";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): Response | null {
  if (req.headers.get("X-Web-Api-Secret") !== process.env.WEB_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/checkout { email } → { initPoint, linkToken }
// Crea la suscripción pendiente y el preapproval en MercadoPago (precio desde settings).
export const checkout = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  if (typeof email !== "string" || !email.includes("@")) return json({ error: "email inválido" }, 400);

  const config = await ctx.runQuery(internal.settings.getSubscriptionConfig, {});
  const { id, linkToken } = await ctx.runMutation(internal.subscriptions.createPending, { email });
  const pre = await createPreapproval({
    email,
    amountClp: config.priceClp,
    reason: config.reason,
    externalReference: id,
    backUrl: `${process.env.WEB_BASE_URL}/suscripcion/listo`,
  });
  return json({ initPoint: pre.init_point, linkToken });
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

const ACTIONS = {
  pause: { mp: "paused", internal: "paused" },
  reactivate: { mp: "authorized", internal: "active" },
  cancel: { mp: "cancelled", internal: "cancelled" },
} as const;

// Pausar/reactivar/cancelar en MercadoPago + reflejarlo en Convex. Vive aquí y no en la
// httpAction porque el admin hace exactamente lo mismo con otro guard: es camino de dinero,
// un solo lugar. Devuelve el resultado y cada llamador arma su Response.
export async function applySubscriptionAction(
  ctx: ActionCtx,
  email: string,
  action: string,
): Promise<{ ok: true; status: SubStatus } | { ok: false; error: string; code: number }> {
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub?.mpPreapprovalId) return { ok: false, error: "sin suscripción activa", code: 404 };
  const m = ACTIONS[action as keyof typeof ACTIONS];
  if (!m) return { ok: false, error: "acción inválida", code: 400 };

  await setPreapprovalStatus(sub.mpPreapprovalId, m.mp);
  await ctx.runMutation(internal.subscriptions.setStatusByEmail, { email, status: m.internal });
  return { ok: true, status: m.internal };
}

// Supresión Ley 21.719: borra el rastro local y cancela el cobro en MercadoPago.
export async function suppressSubscription(ctx: ActionCtx, email: string) {
  const { mpPreapprovalId } = await ctx.runMutation(internal.subscriptions.suppressByEmail, { email });
  if (mpPreapprovalId) {
    try {
      await setPreapprovalStatus(mpPreapprovalId, "cancelled");
    } catch {
      // ponytail: el dato local ya se borró; reintento manual si MercadoPago falla.
    }
  }
}

// POST /api/subscription/action { email, action: "pause"|"reactivate"|"cancel" } → { status }
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

// POST /mercadopago (webhook, sin secreto propio: se verifica leyendo el preapproval en MP).
export const mercadopagoWebhook = httpAction(async (ctx, req) => {
  const body = await req.json().catch(() => null);
  const id = body?.data?.id;
  const type = body?.type ?? body?.topic;
  if (type !== "subscription_preapproval" || typeof id !== "string") {
    return new Response(null, { status: 200 });
  }
  const pre = await getPreapproval(id); // fuente de verdad
  const subId = pre.external_reference;
  if (subId) {
    await ctx.runMutation(internal.subscriptions.applyPreapproval, {
      subId: subId as any, // Id<"subscriptions"> viaja como string en external_reference
      mpPreapprovalId: id,
      mpStatus: pre.status,
    });
  }
  return new Response(null, { status: 200 });
});
