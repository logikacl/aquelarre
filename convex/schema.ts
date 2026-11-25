import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Todo se indexa por `chatId`: el wa_id de WhatsApp (E.164 sin +, numérico). Es el teléfono,
// cosa que la spec original prohibía, pero en WhatsApp no hay otro identificador estable.
// Ver convex/whatsapp.ts para las consecuencias.
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
    chatId: v.optional(v.number()), // ausente hasta que el número de la cuenta le escribe al bot
    // ponytail: enlace por código de un solo uso, reemplazado por el enlace por teléfono
    // (2026-09-16). La web ya no lo muestra y el bot todavía lo acepta. Para quitarlo: vaciar
    // este campo en las filas existentes, y recién después sacarlo del esquema (Convex rechaza
    // un esquema que no calza con los documentos guardados).
    linkToken: v.optional(v.string()),
    // Slug del plan contratado. Ausente = plan por defecto (suscripciones previas a los planes).
    plan: v.optional(v.string()),
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

  // Legado: precio único previo a la tabla `plans`. Nadie lo escribe; solo se lee como
  // precio del plan por defecto mientras `plans` esté vacía (ver convex/plans.ts).
  // ponytail: borrar la tabla cuando exista la primera fila en `plans` en producción.
  settings: defineTable({
    key: v.string(),
    priceClp: v.number(),
    reason: v.string(),
  }).index("by_key", ["key"]),

  // Planes de suscripción: precio, mensajes por día y beneficios de cada uno, editables desde
  // /admin. Cada plan tiene su propio plan en Reveniu (`reveniuPlanId`), porque la URL de
  // retorno tras pagar vive allá. Reveniu guarda el monto en cada suscripción: cambiar
  // `priceClp` afecta solo a las suscripciones nuevas.
  plans: defineTable({
    slug: v.string(),
    name: v.string(),
    priceClp: v.number(),
    dailyLimit: v.number(),
    bullets: v.array(v.string()),
    published: v.boolean(),
    order: v.number(),
    reveniuPlanId: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

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

  // Enlaces de recuperación de contraseña. Se guarda el SHA-256 del token, no el token: una
  // copia de la base no sirve para resetear cuentas. Un solo uso, vence en una hora.
  passwordResets: defineTable({
    tokenHash: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["tokenHash"])
    .index("by_email", ["email"])
    .index("by_expires", ["expiresAt"]),

  // Última vez que se mandó cada alerta de monitoreo (convex/monitor.ts), para no repetirla.
  alerts: defineTable({
    key: v.string(),
    at: v.number(),
  }).index("by_key", ["key"]),

  // Saldo prepago registrado a mano (Fireworks no lo expone por API). Ver convex/monitor.ts.
  saldos: defineTable({
    proveedor: v.string(),
    usd: v.number(),
    at: v.number(),
  }).index("by_proveedor", ["proveedor"]),

  // Cuentas de la web (email+password). El hashing es PBKDF2 (Web Crypto), sin dependencias.
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // formato "saltB64:hashB64"
    // WhatsApp desde el que va a conversar, ya como wa_id (ver convex/telefono.ts). Se pide al
    // registrarse y es lo que enlaza la suscripción con el chat: cuando este número escribe,
    // el bot encuentra la cuenta. Opcional solo por las cuentas anteriores a este cambio.
    phone: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),
});
