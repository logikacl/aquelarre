import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createPreapproval, getPreapproval, setPreapprovalStatus } from "./mercadopago";

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

// POST /api/subscription/action { email, action: "pause"|"reactivate"|"cancel" } → { status }
export const subscriptionAction = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, action } = await req.json();
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub?.mpPreapprovalId) return json({ error: "sin suscripción activa" }, 404);

  const map = {
    pause: { mp: "paused", internal: "paused" },
    reactivate: { mp: "authorized", internal: "active" },
    cancel: { mp: "cancelled", internal: "cancelled" },
  } as const;
  const m = map[action as keyof typeof map];
  if (!m) return json({ error: "acción inválida" }, 400);

  await setPreapprovalStatus(sub.mpPreapprovalId, m.mp);
  await ctx.runMutation(internal.subscriptions.setStatusByEmail, { email, status: m.internal });
  return json({ status: m.internal });
});

// POST /api/subscription/delete { email } → { deleted: true } (supresión Ley 21.719)
export const subscriptionDelete = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  const { mpPreapprovalId } = await ctx.runMutation(internal.subscriptions.suppressByEmail, { email });
  if (mpPreapprovalId) {
    try {
      await setPreapprovalStatus(mpPreapprovalId, "cancelled");
    } catch {
      // ponytail: el dato local ya se borró; reintento manual si MercadoPago falla.
    }
  }
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
