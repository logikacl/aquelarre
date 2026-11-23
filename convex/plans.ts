import { internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { elegirPlan, planPorDefecto, type Plan } from "./planRules";

// Todos los planes, ordenados. Tabla vacía ⇒ el plan de siempre (precio de `settings`,
// plan de Reveniu de la env): así el despliegue es compatible hacia atrás y nada se
// rompe hasta que el admin guarde el primer plan.
export async function cargarPlanes(ctx: QueryCtx): Promise<Plan[]> {
  const rows = await ctx.db.query("plans").collect();
  if (rows.length === 0) {
    const legado = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "subscription"))
      .unique();
    return [planPorDefecto(legado?.priceClp ?? 3000, Number(process.env.REVENIU_PLAN_ID) || undefined)];
  }
  return rows
    .map(({ slug, name, priceClp, dailyLimit, bullets, published, order, reveniuPlanId }) => ({
      slug, name, priceClp, dailyLimit, bullets, published, order, reveniuPlanId,
    }))
    .sort((a, b) => a.order - b.order);
}

export const list = internalQuery({
  args: { onlyPublished: v.optional(v.boolean()) },
  handler: async (ctx, { onlyPublished }) => {
    const all = await cargarPlanes(ctx);
    return onlyPublished ? all.filter((p) => p.published) : all;
  },
});

// El plan que se vende para un slug: el pedido si está publicado; si no, el primero publicado.
export const forSlug = internalQuery({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, { slug }) => elegirPlan(await cargarPlanes(ctx), slug),
});

// El plan que rige a una suscripción. A diferencia de forSlug, acepta planes despublicados:
// despublicar deja de venderlo, no le quita la cuota a quien ya lo pagó.
export async function planDeSuscripcion(ctx: QueryCtx, slug: string | undefined): Promise<Plan> {
  const all = await cargarPlanes(ctx);
  return all.find((p) => p.slug === slug) ?? elegirPlan(all, undefined) ?? all[0];
}

export const ofSubscription = internalQuery({
  args: { slug: v.optional(v.string()) },
  handler: (ctx, { slug }) => planDeSuscripcion(ctx, slug),
});

export const upsert = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    priceClp: v.number(),
    dailyLimit: v.number(),
    bullets: v.array(v.string()),
    published: v.boolean(),
    order: v.number(),
    reveniuPlanId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return existing._id;
    }
    return ctx.db.insert("plans", { ...args, updatedAt: Date.now() });
  },
});

// Solo desde la CLI o el dashboard (`npx convex run plans:remove '{"slug":"x"}'`): no hay
// botón de borrar a propósito, porque un plan con suscriptores debe despublicarse, no
// borrarse (su cuota caería a la del plan por defecto). Sirve para limpiar planes de prueba.
export const remove = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    const enUso = await ctx.db.query("subscriptions").filter((q) => q.eq(q.field("plan"), slug)).first();
    if (enUso) throw new Error(`el plan ${slug} tiene suscripciones: despublícalo en vez de borrarlo`);
    if (row) await ctx.db.delete(row._id);
    return Boolean(row);
  },
});
