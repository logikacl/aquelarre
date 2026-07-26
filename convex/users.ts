import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./password";

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: (ctx, { email }) =>
    ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

// Vista del admin: cada cuenta con el estado de su suscripción ("none" si nunca pagó).
// ponytail: scan completo de `users` + una lectura indexada por fila; a este volumen sobra.
// Paginar (índice by_createdAt + cursor) cuando pasen los ~2.000 usuarios.
export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const rows = await Promise.all(
      users.map(async (u) => {
        const sub = await ctx.db
          .query("subscriptions")
          .withIndex("by_email", (q) => q.eq("email", u.email))
          .unique();
        return {
          email: u.email,
          name: u.name,
          createdAt: u.createdAt,
          status: sub?.status ?? ("none" as const),
          chatId: sub?.chatId ?? null,
          mpPreapprovalId: sub?.mpPreapprovalId ?? null,
          subUpdatedAt: sub?.updatedAt ?? null,
        };
      }),
    );
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
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

// Reset de password sobre una cuenta existente (seed/soporte). Interno a propósito:
// no hay ruta HTTP que lo exponga. ponytail: sin flujo de "olvidé mi clave" hasta que se pida.
export const setPassword = internalMutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (!user) return { ok: false as const, error: "email no existe" };
    await ctx.db.patch(user._id, { passwordHash: await hashPassword(password) });
    return { ok: true as const, id: user._id };
  },
});
