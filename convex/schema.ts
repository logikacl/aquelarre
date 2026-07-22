import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Todo se indexa por chat_id numérico de Telegram (único, estable).
// Nunca usar teléfono/E.164 como clave — fue el bug #1 de la spec original.
export default defineSchema({
  conversations: defineTable({
    chatId: v.number(),
    oracle: v.string(),
    // Solo datos astrológicos derivados — nunca datos identificables (minimización, Ley 21.719).
    astro: v.optional(
      v.object({
        sun: v.string(),
        moon: v.string(),
        asc: v.optional(v.string()), // solo si hubo hora + ciudad conocida
      }),
    ),
    consented: v.boolean(), // chequeo de ruta caliente; el registro auditable vive en `consent`
    // Onboarding: "birth" espera ciudad+fecha, "time" espera hora. Ausente = carta lista.
    onboarding: v.optional(v.union(v.literal("birth"), v.literal("time"))),
    birthPlace: v.optional(v.string()),
    birthDate: v.optional(v.string()), // ISO YYYY-MM-DD
    birthTime: v.optional(v.union(v.string(), v.null())), // "HH:MM" o null si no la sabe
    updatedAt: v.number(),
  }).index("by_chat", ["chatId"]),

  messages: defineTable({
    chatId: v.number(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_chat", ["chatId"]),

  // Registro de consentimiento explícito (Ley 21.719): fecha + versión.
  consent: defineTable({
    chatId: v.number(),
    version: v.string(),
    at: v.number(),
  }).index("by_chat", ["chatId"]),
});
