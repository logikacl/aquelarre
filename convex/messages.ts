import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_ORACLE } from "./personas";

// ponytail: ventana fija de 20 turnos. Cambiar a presupuesto de tokens si el contexto se desborda.
const HISTORY_LIMIT = 20;

export const getConversation = internalQuery({
  args: { chatId: v.number() },
  handler: (ctx, { chatId }) =>
    ctx.db
      .query("conversations")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .unique(),
});

export const recentMessages = internalQuery({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("desc")
      .take(HISTORY_LIMIT);
    return rows.reverse(); // a orden cronológico
  },
});

async function ensure(ctx: any, chatId: number) {
  const existing = await ctx.db
    .query("conversations")
    .withIndex("by_chat", (q: any) => q.eq("chatId", chatId))
    .unique();
  if (existing) return existing;
  const id = await ctx.db.insert("conversations", {
    chatId,
    oracle: DEFAULT_ORACLE,
    consented: false,
    updatedAt: Date.now(),
  });
  return ctx.db.get(id);
}

export const ensureConversation = internalMutation({
  args: { chatId: v.number() },
  handler: (ctx, { chatId }) => ensure(ctx, chatId),
});

export const recordConsent = internalMutation({
  args: { chatId: v.number(), version: v.string() },
  handler: async (ctx, { chatId, version }) => {
    const convo = await ensure(ctx, chatId);
    // Tras consentir arranca el onboarding de la carta natal.
    await ctx.db.patch(convo._id, { consented: true, onboarding: "birth", updatedAt: Date.now() });
    await ctx.db.insert("consent", { chatId, version, at: Date.now() });
  },
});

// Guarda solo la ciudad reconocida y sigue esperando la fecha (acumula entre mensajes).
export const saveBirthPlace = internalMutation({
  args: { chatId: v.number(), place: v.string() },
  handler: async (ctx, { chatId, place }) => {
    const convo = await ensure(ctx, chatId);
    await ctx.db.patch(convo._id, { birthPlace: place, updatedAt: Date.now() });
  },
});

export const saveBirthDate = internalMutation({
  args: { chatId: v.number(), place: v.optional(v.string()), date: v.string() },
  handler: async (ctx, { chatId, place, date }) => {
    const convo = await ensure(ctx, chatId);
    await ctx.db.patch(convo._id, {
      ...(place ? { birthPlace: place } : {}), // no pisa la ciudad previa si este mensaje no trae
      birthDate: date,
      onboarding: "time",
      updatedAt: Date.now(),
    });
  },
});

// Cierra el onboarding: guarda hora (o null) + carta derivada. onboarding queda ausente.
export const finishOnboarding = internalMutation({
  args: {
    chatId: v.number(),
    time: v.union(v.string(), v.null()),
    astro: v.object({
      sun: v.string(),
      moon: v.string(),
      asc: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { chatId, time, astro }) => {
    const convo = await ensure(ctx, chatId);
    await ctx.db.patch(convo._id, {
      birthTime: time,
      astro,
      onboarding: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const addMessage = internalMutation({
  args: {
    chatId: v.number(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, { chatId, role, content }) => {
    const convo = await ensure(ctx, chatId);
    await ctx.db.insert("messages", { chatId, role, content });
    await ctx.db.patch(convo._id, { updatedAt: Date.now() });
  },
});

// /nueva — reinicia la lectura borrando el historial. Conserva consentimiento y conversación.
export const resetSession = internalMutation({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
  },
});
