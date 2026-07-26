import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { applySubscriptionAction, suppressSubscription } from "./webapi";
import { churnMensual } from "./churn";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkAdmin(req: Request): Response | null {
  if (req.headers.get("X-Admin-Api-Secret") !== process.env.ADMIN_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/admin/config          → { priceClp, reason }   (leer)
// POST /api/admin/config/set { priceClp?, reason? }         (escribir)
export const getConfig = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.settings.getSubscriptionConfig, {}));
});

export const setConfig = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { priceClp, reason } = await req.json();
  if (priceClp !== undefined && (typeof priceClp !== "number" || priceClp <= 0)) {
    return json({ error: "priceClp inválido" }, 400);
  }
  await ctx.runMutation(internal.settings.setSubscriptionConfig, { priceClp, reason });
  return json(await ctx.runQuery(internal.settings.getSubscriptionConfig, {}));
});

// POST /api/admin/oracles                         → lista completa
// POST /api/admin/oracles/upsert { ...oracle }    → crea/actualiza
// POST /api/admin/oracles/publish { slug, published }
// POST /api/admin/oracles/delete { slug }
export const listOracles = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.oracles.list, {}));
});

export const upsertOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const o = await req.json();
  if (!o?.slug || !o?.name || !o?.system) return json({ error: "slug, name y system son obligatorios" }, 400);
  const id = await ctx.runMutation(internal.oracles.upsert, {
    slug: o.slug,
    name: o.name,
    system: o.system,
    specialty: o.specialty,
    bio: o.bio,
    photoUrl: o.photoUrl,
    published: Boolean(o.published),
    order: Number(o.order ?? 0),
  });
  return json({ id });
});

export const publishOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { slug, published } = await req.json();
  await ctx.runMutation(internal.oracles.setPublished, { slug, published: Boolean(published) });
  return json({ ok: true });
});

export const deleteOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { slug } = await req.json();
  await ctx.runMutation(internal.oracles.remove, { slug });
  return json({ ok: true });
});

// POST /api/admin/content            → { key: value } de los overrides
// POST /api/admin/content/set { key, value }   → value vacío borra el override
export const getContent = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.content.getAll, {}));
});

export const setContent = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { key, value } = await req.json();
  if (typeof key !== "string" || !key.trim()) return json({ error: "key inválida" }, 400);
  if (typeof value !== "string") return json({ error: "value debe ser string" }, 400);
  await ctx.runMutation(internal.content.set, { key, value });
  return json({ ok: true });
});

// POST /api/admin/upload — body = bytes crudos de la imagen (no JSON).
// Devuelve una URL string, así que aguas abajo se guarda igual que cualquier photoUrl.
export const uploadImage = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const blob = await req.blob();
  // Borde de confianza: valida tipo y tamaño antes de escribir en storage.
  if (!blob.type.startsWith("image/")) return json({ error: "solo imágenes" }, 415);
  if (blob.size > 5_000_000) return json({ error: "máximo 5 MB" }, 413);
  const id = await ctx.storage.store(blob);
  const url = await ctx.storage.getUrl(id);
  if (!url) return json({ error: "no se pudo generar la URL" }, 500);
  return json({ url });
});

// POST /api/admin/users                                     → usuarios + estado de suscripción
// POST /api/admin/users/action { email, action }             → pausar/reactivar/cancelar
// POST /api/admin/users/delete { email }                     → supresión Ley 21.719
export const listUsersAdmin = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.users.listUsers, {}));
});

// El body es borde de confianza: valida antes de tocar MercadoPago.
const badEmail = (email: unknown) => typeof email !== "string" || !email.includes("@");

export const userAction = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { email, action } = await req.json();
  if (badEmail(email)) return json({ error: "email inválido" }, 400);
  const r = await applySubscriptionAction(ctx, email, action);
  return r.ok ? json({ status: r.status }) : json({ error: r.error }, r.code);
});

export const userDelete = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { email } = await req.json();
  if (badEmail(email)) return json({ error: "email inválido" }, 400);
  await suppressSubscription(ctx, email);
  return json({ deleted: true });
});

// POST /api/admin/churn → { mensual, eventos }
// Un solo endpoint: la tabla de la pantalla sale de `mensual` y las dos descargas CSV
// de `mensual` y `eventos` (filas crudas) sin una segunda ida al servidor.
export const churnReport = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const rows = await ctx.runQuery(internal.subscriptions.eventsAll, {});
  const eventos = rows.map(({ email, status, at }) => ({ email, status, at }));
  return json({ mensual: churnMensual(eventos), eventos });
});
