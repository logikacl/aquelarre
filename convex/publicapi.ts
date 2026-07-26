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

// GET /api/public/oracles → { oracles:[{slug,name,specialty,bio,photoUrl}], priceClp, reason }
// Datos para las páginas de marketing. Sin secreto: solo lo publicado, sin el system prompt.
export const publicOracles = httpAction(async (ctx) => {
  const [oracles, config] = await Promise.all([
    ctx.runQuery(internal.oracles.list, { onlyPublished: true }),
    ctx.runQuery(internal.settings.getSubscriptionConfig, {}),
  ]);
  const safe = oracles.map((o) => ({
    slug: o.slug,
    name: o.name,
    specialty: o.specialty ?? null,
    bio: o.bio ?? null,
    photoUrl: o.photoUrl ?? null,
  }));
  return new Response(
    JSON.stringify({ oracles: safe, priceClp: config.priceClp, reason: config.reason }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } },
  );
});
