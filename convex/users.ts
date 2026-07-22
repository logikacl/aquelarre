import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: (ctx, { email }) =>
    ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

export const create = internalMutation({
  args: { email: v.string(), name: v.string(), passwordHash: v.string() },
  handler: async (ctx, { email, name, passwordHash }) => {
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (existing) return { ok: false as const, error: "email ya registrado" };
    await ctx.db.insert("users", { email, name, passwordHash, createdAt: Date.now() });
    return { ok: true as const };
  },
});
