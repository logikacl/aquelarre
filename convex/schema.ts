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
    // Cuota diaria: día chileno (YYYY-MM-DD) + consultas gastadas en él. Vive acá y no se
    // cuenta sobre `messages` porque /nueva borra el historial y reiniciaría la cuota.
    quotaDay: v.optional(v.string()),
    quotaCount: v.optional(v.number()),
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

  // Suscripción mensual (Reveniu). Vive aquí (fuente única): el gate del chat la lee
  // directo y la supresión (Ley 21.719) borra todo en un solo sistema.
  subscriptions: defineTable({
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("ending"), // canceló la renovación; activa hasta el fin del período
      v.literal("cancelled"),
    ),
    reveniuId: v.optional(v.number()),
    chatId: v.optional(v.number()), // ausente hasta que el deep-link lo enlaza
    linkToken: v.optional(v.string()), // token de un solo uso; se borra al enlazar
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_chat", ["chatId"])
    .index("by_token", ["linkToken"])
    .index("by_reveniu", ["reveniuId"]),

  // Historial de cambios de estado. El estado actual no tiene memoria: sin esto
  // no hay reporte de churn posible.
  subscriptionEvents: defineTable({
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("ending"),
      v.literal("cancelled"),
      v.literal("deleted"),
    ),
    // Los da el webhook subscription_renewal_cancelled. Material de churn que viene gratis:
    // Reveniu le pregunta al usuario por qué se va y nos pasa la respuesta.
    cancelReason: v.optional(v.string()),
    feedback: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_at", ["at"]),

  // Config editable desde el admin. Fila única keyed por "subscription".
  settings: defineTable({
    key: v.string(),
    priceClp: v.number(),
    // ponytail: quedó huérfano al migrar a Reveniu — el texto que ve el usuario en el
    // cobro sale del título del plan (REVENIU_PLAN_ID), no de acá. Se sigue leyendo en
    // /admin y en /api/public/oracles. Borrarlo es una limpieza de 5 archivos; hacerla
    // cuando se confirme que el cliente no lo quiere como copy editable.
    reason: v.string(),
  }).index("by_key", ["key"]),

  // Perfiles de astrólogos, gestionables desde el admin. El chat usa `system`;
  // la web usa name/specialty/bio/photoUrl. `slug` es lo que guarda conversations.oracle.
  oracles: defineTable({
    slug: v.string(),
    name: v.string(),
    system: v.string(), // system prompt de la persona (solo backend/chat)
    specialty: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    published: v.boolean(), // visible/seleccionable en la web
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Overrides del copy del sitio. Los defaults viven en lib/copy.ts (front);
  // aquí solo se guarda lo que el admin editó. Tabla vacía = sitio como viene en código.
  content: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Cuentas de la web (email+password). El hashing es PBKDF2 (Web Crypto), sin dependencias.
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // formato "saltB64:hashB64"
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
