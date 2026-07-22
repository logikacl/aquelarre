# Capa de Suscripción, Enlace Web↔Chat y Config Admin (Convex) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir al Convex de Oráculo una capa de suscripción mensual (MercadoPago) que enlaza una cuenta web con el chat de Telegram por `chatId`, reemplaza el stub de paywall por un gate real, permite gestionar la suscripción (pausar/cancelar/reactivar/eliminar) desde la web, y expone config editable desde un panel admin: **el precio** y **los perfiles de los astrólogos** (hoy uno, estructura para escalar).

**Architecture:** Todo vive en el mismo deployment Convex que ya corre el chat (fuente única → el gate lee directo, la supresión Ley 21.719 borra en un solo sistema, y precio/perfiles son datos en BD que el admin edita sin re-deploy). La web (Plan 2, aparte) habla con este backend por httpActions protegidas con secretos compartidos (`WEB_API_SECRET` para el cliente, `ADMIN_API_SECRET` para el panel). El enlace web↔chat usa un **token de un solo uso** en el deep-link de Telegram (`t.me/Bot?start=<token>`). MercadoPago se integra con `fetch` directo (sin SDK), detrás de un módulo reemplazable.

**Tech Stack:** Convex (TypeScript, ESM), API de suscripciones (preapproval) de MercadoPago, Telegram Bot API, checks con `node:assert` corridos por `npx tsx` (convención del repo — ver `birth.check.ts`, `astro.check.ts`).

---

## Prerrequisito

Crear la cuenta de **MercadoPago** (vendedor, Chile) y generar credenciales. **Empezar con credenciales de PRUEBA** (`APP_USR`/test) hasta validar el flujo end-to-end (Task 8); recién ahí pasar a producción. Sin la cuenta creada, las Tasks 1-7 se pueden implementar y desplegar igual (no llaman a MercadoPago hasta la verificación).

## Contexto del backend existente (leer antes de empezar)

- `convex/schema.ts` — tablas `conversations`, `messages`, `consent`, indexadas `by_chat` sobre `chatId` (número de Telegram).
- `convex/http.ts` — webhook `/telegram`. Flujo: `/start` → WELCOME; `/acepto` → consentimiento + inicia onboarding; gate de consentimiento; onboarding de nacimiento; `/nueva`; y en la **línea 112-113 el stub de paywall** (`// ponytail: acceso siempre permitido; reemplazar por chequeo de suscripción`).
- `convex/messages.ts` — mutations/queries internas; `ensure()` inserta la conversación con `oracle: DEFAULT_ORACLE`.
- `convex/oracle.ts` — `respond` (internalAction): arma el system prompt con `buildSystemPrompt(convo.oracle, convo.astro)` y llama a Fireworks.
- `convex/personas.ts` — hoy hardcodea `DEFAULT_ORACLE = "luna"`, el mapa `personas` y `buildSystemPrompt`. **Este plan mueve las personas a la BD** y deja `buildSystemPrompt` como función pura.
- `convex/telegram.ts` — `sendTelegram(chatId, text)` (fetch directo, patrón a imitar para MercadoPago).
- Env vars de runtime (en el deployment): `FIREWORKS_API`, `FIREWORKS_MODEL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`.
- Los checks son archivos `*.check.ts` en la raíz que importan de `./convex/...` y corren con `npx tsx archivo.check.ts`. **No hay framework de test.** Solo se testean helpers puros (no la capa Convex).

## Env vars nuevas (fijar en el deployment Convex antes de la verificación)

```
MP_ACCESS_TOKEN=<access token de MercadoPago>          # de PRUEBA primero
WEB_BASE_URL=https://astrosxchat.cl                     # para back_url y mensajes de Telegram
WEB_API_SECRET=<secreto web↔convex (cliente)>          # protege /api/*
ADMIN_API_SECRET=<secreto admin↔convex>               # protege /api/admin/*
TELEGRAM_BOT_USERNAME=<usuario del bot sin @>          # informativo, para construir el deep-link
```

**El precio y el texto de la suscripción NO son env vars** — viven en la tabla `settings`, editables desde el admin (Task 5).

---

## Estructura de archivos

- **Modificar** `convex/schema.ts` — tablas nuevas: `subscriptions`, `settings`, `oracles`.
- **Crear** `convex/subscription.ts` — lógica pura de suscripción: `parseStartToken`, `mapPreapprovalStatus`, `subscriptionAllows`, `newLinkToken`, tipo `SubStatus`.
- **Modificar** `convex/personas.ts` — `buildSystemPrompt` pasa a función **pura** (recibe el system string); conserva `DEFAULT_ORACLE` y añade `FALLBACK_SYSTEM`.
- **Crear** `subscription.check.ts` y `personas.check.ts` (raíz) — checks de helpers puros.
- **Crear** `convex/mercadopago.ts` — helpers `fetch`: `createPreapproval`, `getPreapproval`, `setPreapprovalStatus`.
- **Crear** `convex/subscriptions.ts` — funciones Convex de suscripción.
- **Crear** `convex/settings.ts` — config de suscripción (precio) en BD: get/set/seed.
- **Crear** `convex/oracles.ts` — perfiles de astrólogos en BD: getBySlug/list/upsert/setPublished/remove/seed.
- **Modificar** `convex/oracle.ts` — leer la persona desde la BD por slug.
- **Crear** `convex/webapi.ts` — httpActions del cliente (`WEB_API_SECRET`) + webhook MercadoPago.
- **Crear** `convex/admin.ts` — httpActions del panel admin (`ADMIN_API_SECRET`): precio y perfiles.
- **Modificar** `convex/http.ts` — enlace de token en `/start`, gate real, y montar rutas de `webapi.ts` y `admin.ts`.

---

## Task 1: Tablas `subscriptions`, `settings`, `oracles` en el schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Añadir las tres tablas al schema**

En `convex/schema.ts`, dentro de `defineSchema({ ... })`, añade tras `consent`:

```ts
  // Suscripción mensual (MercadoPago). Vive aquí (fuente única): el gate del chat la lee
  // directo y la supresión (Ley 21.719) borra todo en un solo sistema.
  subscriptions: defineTable({
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("cancelled"),
    ),
    mpPreapprovalId: v.optional(v.string()),
    chatId: v.optional(v.number()), // ausente hasta que el deep-link lo enlaza
    linkToken: v.optional(v.string()), // token de un solo uso; se borra al enlazar
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_chat", ["chatId"])
    .index("by_token", ["linkToken"]),

  // Config editable desde el admin. Fila única keyed por "subscription".
  settings: defineTable({
    key: v.string(),
    priceClp: v.number(),
    reason: v.string(), // texto que ve el usuario en MercadoPago
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
```

- [ ] **Step 2: Verificar que el schema despliega**

Run: `npx convex dev --once`
Expected: "Convex functions ready" sin errores de validación.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(schema): subscriptions, settings (precio) y oracles (perfiles admin)"
```

---

## Task 2: Helpers puros de suscripción (TDD)

**Files:**
- Create: `convex/subscription.ts`
- Create: `convex/mercadopago.ts` (stub del tipo; se completa en Task 4)
- Test: `subscription.check.ts`

- [ ] **Step 1: Escribir el check que falla**

Crea `subscription.check.ts` en la raíz:

```ts
// Check de los helpers puros de suscripción. Correr: npx tsx subscription.check.ts
import assert from "node:assert";
import {
  parseStartToken, mapPreapprovalStatus, subscriptionAllows, newLinkToken,
} from "./convex/subscription.ts";

assert.strictEqual(parseStartToken("/start abc123"), "abc123");
assert.strictEqual(parseStartToken("/start   tok_XY-9"), "tok_XY-9");
assert.strictEqual(parseStartToken("/start@MiBot abc123"), "abc123");
assert.strictEqual(parseStartToken("/start"), null);
assert.strictEqual(parseStartToken("hola"), null);

assert.strictEqual(mapPreapprovalStatus("authorized"), "active");
assert.strictEqual(mapPreapprovalStatus("paused"), "paused");
assert.strictEqual(mapPreapprovalStatus("cancelled"), "cancelled");
assert.strictEqual(mapPreapprovalStatus("pending"), "pending");

assert.strictEqual(subscriptionAllows({ status: "active" }), true);
assert.strictEqual(subscriptionAllows({ status: "paused" }), false);
assert.strictEqual(subscriptionAllows({ status: "cancelled" }), false);
assert.strictEqual(subscriptionAllows({ status: "pending" }), false);
assert.strictEqual(subscriptionAllows(null), false);
assert.strictEqual(subscriptionAllows(undefined), false);

const t = newLinkToken();
assert.match(t, /^[A-Za-z0-9]{24}$/);
assert.notStrictEqual(newLinkToken(), newLinkToken());

console.log("subscription.check.ts OK");
```

- [ ] **Step 2: Correr el check para verlo fallar**

Run: `npx tsx subscription.check.ts`
Expected: FALLA con `Cannot find module './convex/subscription.ts'`.

- [ ] **Step 3: Implementar los helpers + stub del tipo MpStatus**

Crea `convex/mercadopago.ts` (stub temporal, se completa en Task 4):

```ts
// convex/mercadopago.ts (stub temporal — se completa en Task 4)
export type MpStatus = "pending" | "authorized" | "paused" | "cancelled";
```

Crea `convex/subscription.ts`:

```ts
// Lógica pura de suscripción (sin Convex) → testeable con subscription.check.ts.
import type { MpStatus } from "./mercadopago";

export type SubStatus = "pending" | "active" | "paused" | "cancelled";

// Deep-link: Telegram envía "/start <param>". Devuelve el param o null.
export function parseStartToken(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/);
  return m?.[1] ?? null;
}

// Estado de MercadoPago → nuestro estado interno.
export function mapPreapprovalStatus(mp: MpStatus): SubStatus {
  switch (mp) {
    case "authorized":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

// El chat solo pasa si la suscripción existe y está activa.
export function subscriptionAllows(sub: { status: SubStatus } | null | undefined): boolean {
  return sub?.status === "active";
}

// Token de enlace de un solo uso. 24 chars alfanuméricos (subconjunto de lo que
// Telegram permite en el start param, [A-Za-z0-9_-]).
export function newLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
```

- [ ] **Step 4: Correr el check para verlo pasar**

Run: `npx tsx subscription.check.ts`
Expected: PASA, imprime `subscription.check.ts OK`.

- [ ] **Step 5: Commit**

```bash
git add convex/subscription.ts convex/mercadopago.ts subscription.check.ts
git commit -m "feat(sub): helpers puros de suscripción + check"
```

---

## Task 3: `buildSystemPrompt` como función pura (TDD)

**Files:**
- Modify: `convex/personas.ts`
- Test: `personas.check.ts`

- [ ] **Step 1: Escribir el check que falla**

Crea `personas.check.ts` en la raíz:

```ts
// Check de buildSystemPrompt (puro). Correr: npx tsx personas.check.ts
import assert from "node:assert";
import { buildSystemPrompt, FALLBACK_SYSTEM, DEFAULT_ORACLE } from "./convex/personas.ts";

// Sin carta: devuelve el system tal cual.
assert.strictEqual(buildSystemPrompt("SOY LUNA", undefined), "SOY LUNA");

// Con carta parcial (solo sol/luna): agrega la línea de carta.
const p1 = buildSystemPrompt("BASE", { sun: "Aries", moon: "Tauro" });
assert.match(p1, /^BASE/);
assert.match(p1, /Carta del consultante: Sol en Aries, Luna en Tauro\./);

// Con ascendente incluido.
const p2 = buildSystemPrompt("BASE", { sun: "Aries", moon: "Tauro", asc: "Leo" });
assert.match(p2, /Sol en Aries, Luna en Tauro, Ascendente Leo\./);

// Carta vacía: no agrega línea.
assert.strictEqual(buildSystemPrompt("BASE", {}), "BASE");

// Constantes exportadas.
assert.strictEqual(DEFAULT_ORACLE, "luna");
assert.ok(FALLBACK_SYSTEM.length > 0);

console.log("personas.check.ts OK");
```

- [ ] **Step 2: Correr el check para verlo fallar**

Run: `npx tsx personas.check.ts`
Expected: FALLA (`buildSystemPrompt` aún recibe un slug, no un system string → `p1` no matchea, o error de export `FALLBACK_SYSTEM`).

- [ ] **Step 3: Reescribir `convex/personas.ts`**

Reemplaza el contenido completo por:

```ts
// Slug del oráculo por defecto (lo que guarda conversations.oracle al crear la conversación).
export const DEFAULT_ORACLE = "luna";

// Prompt de respaldo si el oráculo no está en la BD (no debería pasar tras el seed).
export const FALLBACK_SYSTEM = `Eres Luna, una astróloga cálida y perceptiva que atiende consultas en privado.
Hablas español de Chile, cercano pero no exagerado. Nunca inventas certezas: la astrología
que practicas es simbólica y reflexiva, una herramienta para pensar, no una predicción literal.
Escuchas más de lo que hablas. Haces una pregunta a la vez. Respuestas breves (2-4 frases),
salvo que pidan algo más largo. No das consejos médicos, legales ni financieros.`;

type Astro = { sun?: string; moon?: string; asc?: string } | undefined;

// Puro: recibe el system prompt de la persona (desde la BD) y le adjunta la carta derivada.
// Solo signos derivados — nunca datos identificables (minimización, Ley 21.719).
export function buildSystemPrompt(system: string, astro: Astro): string {
  let prompt = system;
  if (astro && (astro.sun || astro.moon || astro.asc)) {
    const parts = [
      astro.sun && `Sol en ${astro.sun}`,
      astro.moon && `Luna en ${astro.moon}`,
      astro.asc && `Ascendente ${astro.asc}`,
    ].filter(Boolean);
    prompt += `\n\nCarta del consultante: ${parts.join(", ")}.`;
  }
  return prompt;
}
```

- [ ] **Step 4: Correr el check para verlo pasar**

Run: `npx tsx personas.check.ts`
Expected: PASA, imprime `personas.check.ts OK`.

- [ ] **Step 5: Verificar que `astro.check.ts` y `birth.check.ts` siguen OK (no se tocaron)**

Run: `npx tsx birth.check.ts && npx tsx astro.check.ts`
Expected: ambos imprimen su `... OK`.

- [ ] **Step 6: Commit**

```bash
git add convex/personas.ts personas.check.ts
git commit -m "refactor(personas): buildSystemPrompt puro (recibe system string) + check"
```

---

## Task 4: Módulo MercadoPago (fetch directo)

**Files:**
- Modify: `convex/mercadopago.ts` (reemplaza el stub de la Task 2)

- [ ] **Step 1: Implementar los helpers de la API**

Reemplaza el contenido de `convex/mercadopago.ts`:

```ts
// Helpers planos (no funciones Convex) para la API de suscripciones (preapproval)
// de MercadoPago. Sin SDK — fetch directo, igual que telegram.ts. CLP sin decimales.
// ponytail: MercadoPago detrás de esta interfaz mínima; para cambiar a Flow/Webpay se
// reemplaza este archivo sin tocar el resto.
const MP_API = "https://api.mercadopago.com";

export type MpStatus = "pending" | "authorized" | "paused" | "cancelled";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
  };
}

// Crea una suscripción SIN plan asociado. `externalReference` = _id de nuestra
// suscripción, para mapear de vuelta en el webhook. Devuelve el punto de redirect.
export async function createPreapproval(opts: {
  email: string;
  amountClp: number;
  reason: string;
  externalReference: string;
  backUrl: string;
}): Promise<{ id: string; init_point: string; status: MpStatus }> {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      reason: opts.reason,
      external_reference: opts.externalReference,
      payer_email: opts.email,
      back_url: opts.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: opts.amountClp,
        currency_id: "CLP",
      },
    }),
  });
  if (!res.ok) throw new Error(`MP createPreapproval ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return { id: d.id, init_point: d.init_point, status: d.status };
}

// Lee un preapproval por id (fuente de verdad del estado; se usa desde el webhook).
export async function getPreapproval(
  id: string,
): Promise<{ status: MpStatus; external_reference?: string }> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`MP getPreapproval ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return { status: d.status, external_reference: d.external_reference };
}

// Pausar / reactivar / cancelar: PUT status.
export async function setPreapprovalStatus(
  id: string,
  status: "paused" | "authorized" | "cancelled",
): Promise<void> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`MP setPreapprovalStatus ${res.status}: ${await res.text()}`);
}
```

- [ ] **Step 2: Verificar que los checks puros siguen pasando (el tipo `MpStatus` no cambió)**

Run: `npx tsx subscription.check.ts`
Expected: PASA, `subscription.check.ts OK`.

- [ ] **Step 3: Commit**

```bash
git add convex/mercadopago.ts
git commit -m "feat(mp): módulo MercadoPago preapproval (create/get/set-status)"
```

---

## Task 5: Config admin — `settings` (precio) y `oracles` (perfiles)

**Files:**
- Create: `convex/settings.ts`
- Create: `convex/oracles.ts`

- [ ] **Step 1: Implementar `convex/settings.ts`**

```ts
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
```

- [ ] **Step 2: Implementar `convex/oracles.ts`**

```ts
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
```

- [ ] **Step 3: Desplegar y sembrar el oráculo por defecto**

Run: `npx convex dev --once`
Expected: despliega sin errores.

Luego siembra "luna" (una vez):
Run: `npx convex run oracles:seedDefault`
Expected: crea la fila `luna` en la tabla `oracles` (verificar en el dashboard). Correrlo de nuevo no duplica (idempotente).

- [ ] **Step 4: Commit**

```bash
git add convex/settings.ts convex/oracles.ts
git commit -m "feat(admin): settings (precio) y oracles (perfiles) editables en BD"
```

---

## Task 6: Funciones Convex de suscripción

**Files:**
- Create: `convex/subscriptions.ts`

- [ ] **Step 1: Implementar las funciones internas**

Crea `convex/subscriptions.ts`:

```ts
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { newLinkToken, mapPreapprovalStatus, subscriptionAllows } from "./subscription";
import type { MpStatus } from "./mercadopago";

const now = () => Date.now();

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("paused"),
  v.literal("cancelled"),
);

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: (ctx, { email }) =>
    ctx.db.query("subscriptions").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

// Query de ruta caliente para el gate del chat.
export const isActiveByChat = internalQuery({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .unique();
    return subscriptionAllows(sub);
  },
});

// Crea (o resetea a pending) la suscripción de un email y le da un token de enlace nuevo.
export const createPending = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const linkToken = newLinkToken();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "pending", linkToken, updatedAt: now() });
      return { id: existing._id, linkToken };
    }
    const id = await ctx.db.insert("subscriptions", {
      email,
      status: "pending",
      linkToken,
      createdAt: now(),
      updatedAt: now(),
    });
    return { id, linkToken };
  },
});

// Webhook: aplica el estado real de MercadoPago a una suscripción (localizada por _id).
export const applyPreapproval = internalMutation({
  args: { subId: v.id("subscriptions"), mpPreapprovalId: v.string(), mpStatus: v.string() },
  handler: async (ctx, { subId, mpPreapprovalId, mpStatus }) => {
    const sub = await ctx.db.get(subId);
    if (!sub) return;
    await ctx.db.patch(subId, {
      mpPreapprovalId,
      status: mapPreapprovalStatus(mpStatus as MpStatus),
      updatedAt: now(),
    });
  },
});

// Enlaza un chatId de Telegram a la suscripción vía token de un solo uso.
export const linkChat = internalMutation({
  args: { linkToken: v.string(), chatId: v.number() },
  handler: async (ctx, { linkToken, chatId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_token", (q) => q.eq("linkToken", linkToken))
      .unique();
    if (!sub) return false;
    await ctx.db.patch(sub._id, { chatId, linkToken: undefined, updatedAt: now() });
    return true;
  },
});

// Cambia el estado interno por email (pause/cancel/reactivate). El cambio en
// MercadoPago lo hace la httpAction antes de llamar esto.
export const setStatusByEmail = internalMutation({
  args: { email: v.string(), status: statusValidator },
  handler: async (ctx, { email, status }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!sub) return;
    await ctx.db.patch(sub._id, { status, updatedAt: now() });
  },
});

// Supresión Ley 21.719: borra la suscripción + TODO el rastro del chat en una sola operación.
export const suppressByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!sub) return { chatId: null, mpPreapprovalId: null };
    const chatId = sub.chatId ?? null;
    if (chatId !== null) {
      for (const table of ["messages", "consent", "conversations"] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .collect();
        await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
      }
    }
    const mpPreapprovalId = sub.mpPreapprovalId ?? null;
    await ctx.db.delete(sub._id);
    return { chatId, mpPreapprovalId };
  },
});
```

- [ ] **Step 2: Verificar que despliega**

Run: `npx convex dev --once`
Expected: despliega sin errores; funciones bajo `internal.subscriptions.*`.

- [ ] **Step 3: Commit**

```bash
git add convex/subscriptions.ts
git commit -m "feat(sub): funciones Convex de suscripción (create/link/gate/status/suppress)"
```

---

## Task 7: Leer la persona desde la BD en el motor del oráculo

**Files:**
- Modify: `convex/oracle.ts`

- [ ] **Step 1: Ajustar imports en `convex/oracle.ts`**

Cambia la línea de import de personas por:

```ts
import { buildSystemPrompt, DEFAULT_ORACLE, FALLBACK_SYSTEM } from "./personas";
```

- [ ] **Step 2: Leer el oráculo de la BD y armar el prompt**

Dentro de `respond`, reemplaza la construcción del system prompt. Donde hoy dice:

```ts
    const system = buildSystemPrompt(convo?.oracle ?? DEFAULT_ORACLE, convo?.astro);
```

por:

```ts
    const slug = convo?.oracle ?? DEFAULT_ORACLE;
    const oracle = await ctx.runQuery(internal.oracles.getBySlug, { slug });
    const system = buildSystemPrompt(oracle?.system ?? FALLBACK_SYSTEM, convo?.astro);
```

- [ ] **Step 3: Verificar que despliega**

Run: `npx convex dev --once`
Expected: despliega sin errores.

- [ ] **Step 4: Verificación manual (chat responde con la persona de BD)**

Con un chat de prueba **ya suscrito y enlazado** (o temporalmente sembrando una suscripción activa a mano en el dashboard), completa onboarding y manda un mensaje.
Expected: el oráculo responde en la voz de "Luna" (leída desde la tabla `oracles`, no del código).

- [ ] **Step 5: Commit**

```bash
git add convex/oracle.ts
git commit -m "refactor(oracle): persona leída desde la BD (oracles) por slug"
```

---

## Task 8: Enlace de token + gate de suscripción en el webhook de Telegram

**Files:**
- Modify: `convex/http.ts`

- [ ] **Step 1: Importar el helper de token**

Junto a los imports de `convex/http.ts`, añade:

```ts
import { parseStartToken } from "./subscription";
```

- [ ] **Step 2: Añadir el mensaje de "sin suscripción"**

Después de `NEED_CONSENT`, añade:

```ts
const NEED_SUBSCRIPTION = `Para conversar con el oráculo necesitas una suscripción activa.
Actívala aquí: ${process.env.WEB_BASE_URL}
Cuando esté lista, vuelve a este chat y escríbeme.`;
```

- [ ] **Step 3: Enlazar el token en `/start`**

Reemplaza el bloque de `/start` por:

```ts
  if (text === "/start" || text.startsWith("/start ") || text.startsWith("/start@")) {
    await ctx.runMutation(internal.messages.ensureConversation, { chatId });
    const token = parseStartToken(text);
    if (token) {
      // Deep-link desde la web tras pagar: amarra este chatId a la suscripción.
      await ctx.runMutation(internal.subscriptions.linkChat, { linkToken: token, chatId });
    }
    await sendTelegram(chatId, WELCOME);
    return ok();
  }
```

- [ ] **Step 4: Gate en `/acepto`**

Reemplaza el bloque de `/acepto` por:

```ts
  if (text === "/acepto") {
    await ctx.runMutation(internal.messages.recordConsent, { chatId, version: CONSENT_VERSION });
    const active = await ctx.runQuery(internal.subscriptions.isActiveByChat, { chatId });
    await sendTelegram(chatId, active ? askBirth(nombre) : NEED_SUBSCRIPTION);
    return ok();
  }
```

- [ ] **Step 5: Reemplazar el stub de paywall por el gate real**

Justo **después** del bloque del gate de consentimiento (`if (!convo?.consented) { ... }`), inserta:

```ts
  // Puerta de suscripción: nada de onboarding ni oráculo sin suscripción activa.
  // ponytail: una query por mensaje en la ruta caliente; indexado by_chat, barato.
  const activeSub = await ctx.runQuery(internal.subscriptions.isActiveByChat, { chatId });
  if (!activeSub) {
    await sendTelegram(chatId, NEED_SUBSCRIPTION);
    return ok();
  }
```

Y **borra** las dos líneas del stub viejo (líneas ~112-113):

```ts
  // Stub de paywall — Fase 1 sin pago.
  // ponytail: acceso siempre permitido; reemplazar por chequeo de suscripción Flow en Fase 2.
```

- [ ] **Step 6: Desplegar y verificar el gate (sin suscripción)**

Run: `npx convex dev --once`
Luego, desde una cuenta de Telegram sin suscripción: `/start` → WELCOME; `/acepto` → `NEED_SUBSCRIPTION` (no pide fecha); cualquier mensaje → `NEED_SUBSCRIPTION`.
Expected: chat bloqueado sin suscripción.

- [ ] **Step 7: Commit**

```bash
git add convex/http.ts
git commit -m "feat(http): enlace de deep-link + gate de suscripción real (reemplaza stub)"
```

---

## Task 9: httpActions del cliente + webhook MercadoPago

**Files:**
- Create: `convex/webapi.ts`
- Modify: `convex/http.ts`

- [ ] **Step 1: Implementar `convex/webapi.ts`**

```ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createPreapproval, getPreapproval, setPreapprovalStatus } from "./mercadopago";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): Response | null {
  if (req.headers.get("X-Web-Api-Secret") !== process.env.WEB_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/checkout { email } → { initPoint, linkToken }
// Crea la suscripción pendiente y el preapproval en MercadoPago (precio desde settings).
export const checkout = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  if (typeof email !== "string" || !email.includes("@")) return json({ error: "email inválido" }, 400);

  const config = await ctx.runQuery(internal.settings.getSubscriptionConfig, {});
  const { id, linkToken } = await ctx.runMutation(internal.subscriptions.createPending, { email });
  const pre = await createPreapproval({
    email,
    amountClp: config.priceClp,
    reason: config.reason,
    externalReference: id,
    backUrl: `${process.env.WEB_BASE_URL}/suscripcion/listo`,
  });
  return json({ initPoint: pre.init_point, linkToken });
});

// POST /api/subscription { email } → { status, chatId, linkToken }
export const subscription = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub) return json({ status: "none" });
  return json({ status: sub.status, chatId: sub.chatId ?? null, linkToken: sub.linkToken ?? null });
});

// POST /api/subscription/action { email, action: "pause"|"reactivate"|"cancel" } → { status }
export const subscriptionAction = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, action } = await req.json();
  const sub = await ctx.runQuery(internal.subscriptions.getByEmail, { email });
  if (!sub?.mpPreapprovalId) return json({ error: "sin suscripción activa" }, 404);

  const map = {
    pause: { mp: "paused", internal: "paused" },
    reactivate: { mp: "authorized", internal: "active" },
    cancel: { mp: "cancelled", internal: "cancelled" },
  } as const;
  const m = map[action as keyof typeof map];
  if (!m) return json({ error: "acción inválida" }, 400);

  await setPreapprovalStatus(sub.mpPreapprovalId, m.mp);
  await ctx.runMutation(internal.subscriptions.setStatusByEmail, { email, status: m.internal });
  return json({ status: m.internal });
});

// POST /api/subscription/delete { email } → { deleted: true } (supresión Ley 21.719)
export const subscriptionDelete = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email } = await req.json();
  const { mpPreapprovalId } = await ctx.runMutation(internal.subscriptions.suppressByEmail, { email });
  if (mpPreapprovalId) {
    try {
      await setPreapprovalStatus(mpPreapprovalId, "cancelled");
    } catch {
      // ponytail: el dato local ya se borró; reintento manual si MercadoPago falla.
    }
  }
  return json({ deleted: true });
});

// POST /mercadopago (webhook, sin secreto propio: se verifica leyendo el preapproval en MP).
export const mercadopagoWebhook = httpAction(async (ctx, req) => {
  const body = await req.json().catch(() => null);
  const id = body?.data?.id;
  const type = body?.type ?? body?.topic;
  if (type !== "subscription_preapproval" || typeof id !== "string") {
    return new Response(null, { status: 200 });
  }
  const pre = await getPreapproval(id); // fuente de verdad
  const subId = pre.external_reference;
  if (subId) {
    await ctx.runMutation(internal.subscriptions.applyPreapproval, {
      subId: subId as any, // Id<"subscriptions"> viaja como string en external_reference
      mpPreapprovalId: id,
      mpStatus: pre.status,
    });
  }
  return new Response(null, { status: 200 });
});
```

- [ ] **Step 2: Montar las rutas del cliente en `http.ts`**

Añade imports y rutas (antes de `export default http;`):

```ts
import {
  checkout, subscription, subscriptionAction, subscriptionDelete, mercadopagoWebhook,
} from "./webapi";

http.route({ path: "/api/checkout", method: "POST", handler: checkout });
http.route({ path: "/api/subscription", method: "POST", handler: subscription });
http.route({ path: "/api/subscription/action", method: "POST", handler: subscriptionAction });
http.route({ path: "/api/subscription/delete", method: "POST", handler: subscriptionDelete });
http.route({ path: "/mercadopago", method: "POST", handler: mercadopagoWebhook });
```

- [ ] **Step 3: Desplegar y verificar el guard de secreto**

Run: `npx convex dev --once`
Run (reemplaza `<site>`):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<site>.convex.site/api/subscription \
  -H "Content-Type: application/json" -d '{"email":"x@y.com"}'
```
Expected: `401` sin header. Con `-H "X-Web-Api-Secret: <WEB_API_SECRET>"` → `200` `{"status":"none"}`.

- [ ] **Step 4: Commit**

```bash
git add convex/webapi.ts convex/http.ts
git commit -m "feat(webapi): checkout (precio de settings), gestión de suscripción y webhook MP"
```

---

## Task 10: httpActions del panel admin (precio + perfiles)

**Files:**
- Create: `convex/admin.ts`
- Modify: `convex/http.ts`

- [ ] **Step 1: Implementar `convex/admin.ts`**

```ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkAdmin(req: Request): Response | null {
  if (req.headers.get("X-Admin-Api-Secret") !== process.env.ADMIN_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/admin/config          → { priceClp, reason }   (leer)
// POST /api/admin/config/set { priceClp?, reason? }         (escribir)
export const getConfig = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.settings.getSubscriptionConfig, {}));
});

export const setConfig = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { priceClp, reason } = await req.json();
  if (priceClp !== undefined && (typeof priceClp !== "number" || priceClp <= 0)) {
    return json({ error: "priceClp inválido" }, 400);
  }
  await ctx.runMutation(internal.settings.setSubscriptionConfig, { priceClp, reason });
  return json(await ctx.runQuery(internal.settings.getSubscriptionConfig, {}));
});

// POST /api/admin/oracles                         → lista completa
// POST /api/admin/oracles/upsert { ...oracle }    → crea/actualiza
// POST /api/admin/oracles/publish { slug, published }
// POST /api/admin/oracles/delete { slug }
export const listOracles = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.oracles.list, {}));
});

export const upsertOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const o = await req.json();
  if (!o?.slug || !o?.name || !o?.system) return json({ error: "slug, name y system son obligatorios" }, 400);
  const id = await ctx.runMutation(internal.oracles.upsert, {
    slug: o.slug,
    name: o.name,
    system: o.system,
    specialty: o.specialty,
    bio: o.bio,
    photoUrl: o.photoUrl,
    published: Boolean(o.published),
    order: Number(o.order ?? 0),
  });
  return json({ id });
});

export const publishOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { slug, published } = await req.json();
  await ctx.runMutation(internal.oracles.setPublished, { slug, published: Boolean(published) });
  return json({ ok: true });
});

export const deleteOracle = httpAction(async (ctx, req) => {
  const bad = checkAdmin(req);
  if (bad) return bad;
  const { slug } = await req.json();
  await ctx.runMutation(internal.oracles.remove, { slug });
  return json({ ok: true });
});
```

- [ ] **Step 2: Montar las rutas admin en `http.ts`**

```ts
import {
  getConfig, setConfig, listOracles, upsertOracle, publishOracle, deleteOracle,
} from "./admin";

http.route({ path: "/api/admin/config", method: "POST", handler: getConfig });
http.route({ path: "/api/admin/config/set", method: "POST", handler: setConfig });
http.route({ path: "/api/admin/oracles", method: "POST", handler: listOracles });
http.route({ path: "/api/admin/oracles/upsert", method: "POST", handler: upsertOracle });
http.route({ path: "/api/admin/oracles/publish", method: "POST", handler: publishOracle });
http.route({ path: "/api/admin/oracles/delete", method: "POST", handler: deleteOracle });
```

- [ ] **Step 3: Desplegar y verificar precio editable**

Run: `npx convex dev --once`
Run (reemplaza `<site>` y `<ADMIN_API_SECRET>`):
```bash
curl -s -X POST https://<site>.convex.site/api/admin/config/set \
  -H "Content-Type: application/json" -H "X-Admin-Api-Secret: <ADMIN_API_SECRET>" \
  -d '{"priceClp":5000}'
```
Expected: `{"priceClp":5000,"reason":"..."}`. Sin el header → `401`. Un checkout posterior usa 5000.

- [ ] **Step 4: Verificar perfiles editables**

Run:
```bash
curl -s -X POST https://<site>.convex.site/api/admin/oracles \
  -H "Content-Type: application/json" -H "X-Admin-Api-Secret: <ADMIN_API_SECRET>"
```
Expected: lista con "luna". Un `upsert` con un slug nuevo lo agrega; `publish` lo oculta/muestra.

- [ ] **Step 5: Commit**

```bash
git add convex/admin.ts convex/http.ts
git commit -m "feat(admin): httpActions de precio y perfiles de astrólogos"
```

---

## Task 11: Verificación de integración end-to-end (sandbox MercadoPago)

**Files:** ninguno (verificación manual). Requiere credenciales de **prueba** en `MP_ACCESS_TOKEN` y las env vars fijadas en el deployment.

- [ ] **Step 1: Confirmar preapproval CLP + init_point (precio desde settings)**

Fija un precio conocido vía admin (Task 10 Step 3), luego:
```bash
curl -s -X POST https://<site>.convex.site/api/checkout \
  -H "Content-Type: application/json" -H "X-Web-Api-Secret: <WEB_API_SECRET>" \
  -d '{"email":"test_user@testuser.com"}'
```
Expected: `{ "initPoint": "https://www.mercadopago.cl/...", "linkToken": "<24 chars>" }`.
**Si MercadoPago devuelve error:** confirmar token de prueba de vendedor **Chile**, `transaction_amount` entero, y que suscripciones CLP estén habilitadas en la cuenta (ver decisión pendiente).

- [ ] **Step 2: Autorizar el pago y confirmar el webhook**

Configura la URL de notificaciones a `https://<site>.convex.site/mercadopago` en el panel de MercadoPago. Abre el `initPoint`, autoriza con un **usuario de prueba comprador**.
Verifica en el dashboard de Convex que la fila de `subscriptions` pasó a `status: "active"` con `mpPreapprovalId`.
Expected: suscripción `active` tras la autorización.

- [ ] **Step 3: Enlazar el chat con el deep-link**

Abre `https://t.me/<TELEGRAM_BOT_USERNAME>?start=<linkToken>` (el token del Step 1). En el bot aparece WELCOME; en `subscriptions` la fila ahora tiene `chatId` y `linkToken` vacío. Luego `/acepto` → pide fecha de nacimiento; completa onboarding y manda un mensaje → el oráculo responde.
Expected: usuario activo atraviesa el gate y conversa.

- [ ] **Step 4: Pausar y verificar bloqueo**

```bash
curl -s -X POST https://<site>.convex.site/api/subscription/action \
  -H "Content-Type: application/json" -H "X-Web-Api-Secret: <WEB_API_SECRET>" \
  -d '{"email":"test_user@testuser.com","action":"pause"}'
```
Manda un mensaje en el chat.
Expected: `{"status":"paused"}`; el chat responde `NEED_SUBSCRIPTION`. `reactivate` lo rehabilita.

- [ ] **Step 5: Supresión (Ley 21.719)**

```bash
curl -s -X POST https://<site>.convex.site/api/subscription/delete \
  -H "Content-Type: application/json" -H "X-Web-Api-Secret: <WEB_API_SECRET>" \
  -d '{"email":"test_user@testuser.com"}'
```
Verifica en el dashboard que desaparecieron la fila de `subscriptions` y todas las de `conversations`/`messages`/`consent` de ese `chatId`.
Expected: `{"deleted":true}` y cero rastro del usuario.

- [ ] **Step 6: Cerrar**

Sin cambios de código. Documentar en el PR final los resultados de la verificación manual.

---

## Decisiones pendientes que tocan este plan

- **Precio inicial:** el seed usa `DEFAULT_PRICE_CLP = 3000`; ajústalo desde el admin cuando definas el número. Ya no bloquea nada.
- **Cuenta MercadoPago:** crearla (prerrequisito). Empezar con credenciales de prueba; pasar a producción tras la Task 11.
- **Disponibilidad de suscripción recurrente CLP en MercadoPago Chile:** confirmada en la doc, pero la habilitación por cuenta puede variar. Punto de detección: Task 11 Step 1. Si no está disponible, `mercadopago.ts` es reemplazable por Flow/Webpay sin tocar el resto.
- **Verificación de firma del webhook (`x-signature`):** omitida en Fase 1 (el webhook confía en `getPreapproval`, no en el body). Endurecer después.
- **Autenticación del admin:** el backend solo verifica `ADMIN_API_SECRET`. Quién es admin (login, roles) vive en el front admin (Plan 2/3).

## Fuera de alcance (van al front — Plan 2)

Registro email+password del cliente, sesión del profile, **el panel admin (UI) para editar precio y perfiles**, las maquetas (`DiseñoBase/`) hechas funcionales, CMP de cookies (`consent/`), páginas legales, y las llamadas del front a estas httpActions con `WEB_API_SECRET` / `ADMIN_API_SECRET`.
