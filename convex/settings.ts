import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const KEY = "subscription";
const DEFAULT_PRICE_CLP = 3000; // ponytail: valor de arranque; el admin lo edita en caliente
const DEFAULT_REASON = "Suscripción Astros x Chat";

// Config de suscripción (precio + texto). Siembra por defecto si no existe.
export const getSubscriptionConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", KEY)).unique();
    return {
      priceClp: row?.priceClp ?? DEFAULT_PRICE_CLP,
      reason: row?.reason ?? DEFAULT_REASON,
    };
  },
});

// Admin: fija precio y/o texto. Crea la fila si no existe.
export const setSubscriptionConfig = internalMutation({
  args: { priceClp: v.optional(v.number()), reason: v.optional(v.string()) },
  handler: async (ctx, { priceClp, reason }) => {
    const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", KEY)).unique();
    if (row) {
      await ctx.db.patch(row._id, {
        ...(priceClp !== undefined ? { priceClp } : {}),
        ...(reason !== undefined ? { reason } : {}),
      });
      return;
    }
    await ctx.db.insert("settings", {
      key: KEY,
      priceClp: priceClp ?? DEFAULT_PRICE_CLP,
      reason: reason ?? DEFAULT_REASON,
    });
  },
});
