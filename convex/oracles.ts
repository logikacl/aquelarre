import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_ORACLE, FALLBACK_SYSTEM } from "./personas";

const now = () => Date.now();

// Chat: persona por slug (para armar el system prompt).
export const getBySlug = internalQuery({
  args: { slug: v.string() },
  handler: (ctx, { slug }) =>
    ctx.db.query("oracles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
});

// Web/admin: lista de oráculos ordenada. `onlyPublished` para la web pública.
export const list = internalQuery({
  args: { onlyPublished: v.optional(v.boolean()) },
  handler: async (ctx, { onlyPublished }) => {
    const all = await ctx.db.query("oracles").collect();
    const rows = onlyPublished ? all.filter((o) => o.published) : all;
    return rows.sort((a, b) => a.order - b.order);
  },
});

// Admin: crea o actualiza por slug (upsert).
export const upsert = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    system: v.string(),
    specialty: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oracles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now() });
      return existing._id;
    }
    return ctx.db.insert("oracles", { ...args, updatedAt: now() });
  },
});

// Admin: publicar/despublicar.
export const setPublished = internalMutation({
  args: { slug: v.string(), published: v.boolean() },
  handler: async (ctx, { slug, published }) => {
    const row = await ctx.db.query("oracles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (row) await ctx.db.patch(row._id, { published, updatedAt: now() });
  },
});

// Admin: borrar un oráculo.
export const remove = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db.query("oracles").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (row) await ctx.db.delete(row._id);
  },
});

// Siembra el oráculo por defecto ("luna") si la tabla está vacía. Idempotente.
export const seedDefault = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("oracles")
      .withIndex("by_slug", (q) => q.eq("slug", DEFAULT_ORACLE))
      .unique();
    if (existing) return;
    await ctx.db.insert("oracles", {
      slug: DEFAULT_ORACLE,
      name: "Luna",
      system: FALLBACK_SYSTEM,
      specialty: "Astrología simbólica",
      bio: "Astróloga cálida y perceptiva. Escucha más de lo que habla.",
      published: true,
      order: 0,
      updatedAt: now(),
    });
  },
});
