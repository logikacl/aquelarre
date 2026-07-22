import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
