import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// GET /api/public/content → { key: value } de los overrides de copy.
// Sin secreto: son textos públicos. Vacío = el front usa sus defaults de lib/copy.ts.
export const publicContent = httpAction(async (ctx) => {
  const content = await ctx.runQuery(internal.content.getAll, {});
  return new Response(JSON.stringify(content), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
});

// GET /api/public/plans → [{ slug, name, priceClp, dailyLimit, bullets }] publicados, en orden.
// Sin secreto y sin el id de Reveniu: es lo que muestra la web.
export const publicPlans = httpAction(async (ctx) => {
  const plans = await ctx.runQuery(internal.plans.list, { onlyPublished: true });
  const safe = plans.map(({ slug, name, priceClp, dailyLimit, bullets }) => ({ slug, name, priceClp, dailyLimit, bullets }));
  return new Response(JSON.stringify(safe), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
});

// GET /api/public/oracles → { oracles:[{slug,name,specialty,bio,photoUrl}] }
// Sin secreto: solo lo publicado, sin el system prompt.
export const publicOracles = httpAction(async (ctx) => {
  const oracles = await ctx.runQuery(internal.oracles.list, { onlyPublished: true });
  const safe = oracles.map((o) => ({
    slug: o.slug,
    name: o.name,
    specialty: o.specialty ?? null,
    bio: o.bio ?? null,
    photoUrl: o.photoUrl ?? null,
  }));
  return new Response(
    JSON.stringify({ oracles: safe }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } },
  );
});
