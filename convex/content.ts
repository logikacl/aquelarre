import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Overrides del copy del sitio. Los defaults viven en lib/copy.ts (front);
// aquí solo está lo que el admin editó.
export const getAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("content").collect();
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
  },
});

// Admin: upsert por key. Valor vacío = borrar la fila, no guardar "".
// Es la única forma de volver al default del código: si guardáramos "" el sitio
// mostraría un texto en blanco en vez del texto de lib/copy.ts.
export const set = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const row = await ctx.db.query("content").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (!value.trim()) {
      if (row) await ctx.db.delete(row._id);
      return;
    }
    if (row) await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
    else await ctx.db.insert("content", { key, value, updatedAt: Date.now() });
  },
});
