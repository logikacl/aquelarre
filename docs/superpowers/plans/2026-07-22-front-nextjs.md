# Front Next.js: Web funcional (marketing + checkout + profile + admin) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **DEPENDE DEL PLAN 1** (`2026-07-22-suscripcion-enlace-convex.md`): asume que las httpActions de suscripción/admin y las tablas `subscriptions`/`settings`/`oracles` ya existen y están desplegadas.

**Goal:** Convertir las maquetas estáticas de `DiseñoBase/` en una app Next.js (App Router) desplegada en Vercel: sitio de marketing con oráculos y precio en vivo, registro + checkout con MercadoPago, profile del cliente para gestionar la suscripción (pausar/cancelar/reactivar/eliminar), panel admin para editar precio y perfiles, y consentimiento de cookies (CMP).

**Architecture:** Next.js es la capa de presentación y el **único cliente autenticado** del backend. Todo dato persistente vive en Convex (Plan 1 + tabla `users` que agrega este plan). El browser nunca ve secretos: los componentes de cliente llaman a Server Actions / Route Handlers de Next, que a su vez llaman a las httpActions de Convex con `WEB_API_SECRET`/`ADMIN_API_SECRET`. La sesión email+password la maneja Auth.js v5 (Credentials); el hashing vive en Convex con Web Crypto (PBKDF2, sin dependencias). El enlace con el chat es el deep-link de Telegram con el `linkToken` del Plan 1.

**Tech Stack:** Next.js 15 (App Router, React Server Components), TypeScript, Tailwind CSS (portado de la config de las maquetas), Auth.js v5 (`next-auth@5`), Vercel. Sin librería de pagos en el front (el pago ocurre en MercadoPago vía redirect). Módulo CMP existente en `consent/`.

---

## Prerrequisitos y decisiones fijadas

- **Plan 1 desplegado** con su `WEB_API_SECRET` y `ADMIN_API_SECRET` fijados en el deployment Convex.
- **Auth:** email+password vía Auth.js v5 Credentials. Store + hashing en Convex (este plan lo agrega). Admin = email presente en la env `ADMIN_EMAILS` (sin tabla de roles).
- **Copy de las maquetas:** las maquetas dicen "WhatsApp" y `wa.me` → cambiar a **Telegram** y al deep-link `t.me`. Precios contradictorios y features irreales (Tarot, PDF, predicciones, múltiples planes) → **un solo plan** con el precio de `settings`. IVA mostrado 16% → Chile es 19% (o mostrar "IVA incluido" sin desglose, ver Task 10).
- **`DiseñoBase/` está en `.gitignore`** (maquetas crudas, fuente de la que se portan las páginas — no se despliegan tal cual).

## Estructura del proyecto Next.js (a crear en la raíz del repo, junto a `convex/`)

```
app/
  layout.tsx                 # layout raíz: fuentes, <ConsentProvider>, nav, footer
  globals.css                # Tailwind + reset
  page.tsx                   # landing (/)
  planes/page.tsx            # /planes
  oraculos/[slug]/page.tsx   # perfil de un oráculo
  checkout/page.tsx          # registro + iniciar pago
  suscripcion/listo/page.tsx # post-pago: estado + deep-link a Telegram
  cuenta/page.tsx            # profile (authed): gestionar suscripción
  admin/page.tsx             # panel admin (authed + admin): precio + perfiles
  api/auth/[...nextauth]/route.ts  # Auth.js
components/
  Nav.tsx  Footer.tsx  SubscriptionManager.tsx  OracleForm.tsx  PriceEditor.tsx
lib/
  backend.ts                 # wrapper server-only a las httpActions de Convex
  auth.ts                    # config de Auth.js v5
consent/ …                   # módulo CMP (copiado; ya existe en el repo)
convex/ …                    # Plan 1 + tabla users y auth de este plan
tailwind.config.ts  next.config.ts  middleware.ts  .env.local
```

## Env vars del front (Vercel + `.env.local`)

```
CONVEX_SITE_URL=https://<deployment>.convex.site   # base de las httpActions
WEB_API_SECRET=<mismo secreto del Plan 1>          # server-only
ADMIN_API_SECRET=<mismo secreto admin del Plan 1>  # server-only
ADMIN_EMAILS=iguldman@gmail.com                    # emails con acceso al panel admin
AUTH_SECRET=<generar con: npx auth secret>         # Auth.js
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<usuario del bot sin @>
NEXT_PUBLIC_CONSENT_LOG_URL=https://robust-snake-904.convex.site/consent  # CMP compartido
```

---

## Task 1: Backend — tabla `users` + hashing (Web Crypto, TDD)

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/password.ts` (funciones puras async: hash/verify)
- Test: `password.check.ts`

- [ ] **Step 1: Añadir la tabla `users` al schema**

En `convex/schema.ts`, dentro de `defineSchema({...})`, añade:

```ts
  // Cuentas de la web (email+password). El hashing es PBKDF2 (Web Crypto), sin dependencias.
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // formato "saltB64:hashB64"
    createdAt: v.number(),
  }).index("by_email", ["email"]),
```

- [ ] **Step 2: Escribir el check que falla**

Crea `password.check.ts` en la raíz:

```ts
// Check de hash/verify de password (PBKDF2 Web Crypto). Correr: npx tsx password.check.ts
import assert from "node:assert";
import { hashPassword, verifyPassword } from "./convex/password.ts";

const h = await hashPassword("correcta-horse");
assert.match(h, /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/); // salt:hash en base64
assert.strictEqual(await verifyPassword("correcta-horse", h), true);
assert.strictEqual(await verifyPassword("otra", h), false);
// dos hashes del mismo password difieren (salt aleatorio)
assert.notStrictEqual(await hashPassword("x"), await hashPassword("x"));

console.log("password.check.ts OK");
```

- [ ] **Step 3: Correr el check para verlo fallar**

Run: `npx tsx password.check.ts`
Expected: FALLA con `Cannot find module './convex/password.ts'`.

- [ ] **Step 4: Implementar `convex/password.ts`**

```ts
// Hashing de password con PBKDF2 vía Web Crypto (disponible en el runtime de Convex y
// en Node 20). Sin dependencias. Formato almacenado: "saltB64:hashB64".
const ITERATIONS = 100_000;

const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return b64(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `${b64(salt)}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const hash = await derive(password, unb64(saltB64));
  return hash === hashB64;
}
```

- [ ] **Step 5: Correr el check para verlo pasar**

Run: `npx tsx password.check.ts`
Expected: PASA, imprime `password.check.ts OK`.

- [ ] **Step 6: Desplegar el schema y commit**

Run: `npx convex dev --once`
Expected: despliega sin errores.

```bash
git add convex/schema.ts convex/password.ts password.check.ts
git commit -m "feat(auth): tabla users + hashing PBKDF2 (Web Crypto) + check"
```

---

## Task 2: Backend — funciones y httpActions de auth

**Files:**
- Create: `convex/users.ts`
- Create: `convex/authapi.ts`
- Modify: `convex/http.ts`

- [ ] **Step 1: Implementar `convex/users.ts` (mutations/queries internas)**

```ts
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
```

- [ ] **Step 2: Implementar `convex/authapi.ts` (httpActions guardadas por WEB_API_SECRET)**

```ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { hashPassword, verifyPassword } from "./password";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): Response | null {
  if (req.headers.get("X-Web-Api-Secret") !== process.env.WEB_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/auth/register { name, email, password } → { ok } | { ok:false, error }
export const register = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { name, email, password } = await req.json();
  if (typeof email !== "string" || !email.includes("@") || typeof password !== "string" || password.length < 8) {
    return json({ ok: false, error: "email inválido o password menor a 8 caracteres" }, 400);
  }
  const passwordHash = await hashPassword(password);
  const res = await ctx.runMutation(internal.users.create, {
    email,
    name: typeof name === "string" ? name : "",
    passwordHash,
  });
  return json(res, res.ok ? 200 : 409);
});

// POST /api/auth/login { email, password } → { email, name } | 401
export const login = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, password } = await req.json();
  const user = await ctx.runQuery(internal.users.getByEmail, { email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "credenciales inválidas" }, 401);
  }
  return json({ email: user.email, name: user.name });
});
```

- [ ] **Step 3: Montar las rutas en `convex/http.ts`**

```ts
import { register, login } from "./authapi";

http.route({ path: "/api/auth/register", method: "POST", handler: register });
http.route({ path: "/api/auth/login", method: "POST", handler: login });
```

- [ ] **Step 4: Desplegar y verificar**

Run: `npx convex dev --once`
Run (reemplaza `<site>` y `<WEB_API_SECRET>`):
```bash
curl -s -X POST https://<site>.convex.site/api/auth/register \
  -H "Content-Type: application/json" -H "X-Web-Api-Secret: <WEB_API_SECRET>" \
  -d '{"name":"Test","email":"t@t.com","password":"12345678"}'
curl -s -X POST https://<site>.convex.site/api/auth/login \
  -H "Content-Type: application/json" -H "X-Web-Api-Secret: <WEB_API_SECRET>" \
  -d '{"email":"t@t.com","password":"12345678"}'
```
Expected: register → `{"ok":true}`; register de nuevo → `{"ok":false,...}` (409); login correcto → `{"email":"t@t.com","name":"Test"}`; login con password mala → 401.

- [ ] **Step 5: Commit**

```bash
git add convex/users.ts convex/authapi.ts convex/http.ts
git commit -m "feat(auth): httpActions register/login (verificación server-side)"
```

---

## Task 3: Backend — endpoint público de oráculos + precio

**Files:**
- Create: `convex/publicapi.ts`
- Modify: `convex/http.ts`

- [ ] **Step 1: Implementar `convex/publicapi.ts`**

```ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// GET /api/public/oracles → { oracles:[{slug,name,specialty,bio,photoUrl}], priceClp, reason }
// Datos para las páginas de marketing. Sin secreto: solo lo publicado, sin el system prompt.
export const publicOracles = httpAction(async (ctx) => {
  const [oracles, config] = await Promise.all([
    ctx.runQuery(internal.oracles.list, { onlyPublished: true }),
    ctx.runQuery(internal.settings.getSubscriptionConfig, {}),
  ]);
  const safe = oracles.map((o) => ({
    slug: o.slug,
    name: o.name,
    specialty: o.specialty ?? null,
    bio: o.bio ?? null,
    photoUrl: o.photoUrl ?? null,
  }));
  return new Response(
    JSON.stringify({ oracles: safe, priceClp: config.priceClp, reason: config.reason }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } },
  );
});
```

- [ ] **Step 2: Montar la ruta (GET) en `convex/http.ts`**

```ts
import { publicOracles } from "./publicapi";

http.route({ path: "/api/public/oracles", method: "GET", handler: publicOracles });
```

- [ ] **Step 3: Desplegar y verificar**

Run: `npx convex dev --once`
Run: `curl -s https://<site>.convex.site/api/public/oracles`
Expected: `{"oracles":[{"slug":"luna",...}],"priceClp":3000,"reason":"..."}`. **Nunca** incluye `system`.

- [ ] **Step 4: Commit**

```bash
git add convex/publicapi.ts convex/http.ts
git commit -m "feat(public): endpoint de oráculos publicados + precio para el front"
```

---

## Task 4: Scaffold Next.js + Tailwind + fuentes + layout base

**Files:**
- Create: `package.json` (merge), `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `app/globals.css`, `app/layout.tsx`, `components/Nav.tsx`, `components/Footer.tsx`

- [ ] **Step 1: Instalar dependencias del front**

Run:
```bash
npm install next@15 react@19 react-dom@19 next-auth@5
npm install -D tailwindcss@3 postcss autoprefixer @types/node @types/react @types/react-dom typescript
```
Añade scripts a `package.json` (junto a los `convex` existentes):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "convex:dev": "convex dev",
  "convex:deploy": "convex deploy"
}
```

- [ ] **Step 2: Config de Tailwind portando los colores de la maqueta**

Crea `tailwind.config.ts`. Copia el objeto `colors` **completo** desde el `tailwind.config` inline de cualquier maqueta (`DiseñoBase/astros_x_chat_inicio/code.html`, línea 11: `background`, `primary: "#c2652a"`, `on-surface`, `surface-container`, `tertiary`, etc.) al `theme.extend.colors`, y define las fuentes:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PEGAR AQUÍ el objeto colors de la maqueta (DiseñoBase/.../code.html línea 11).
        // Ej: background: "#faf5ee", primary: "#c2652a", "on-surface": "#3a302a", ...
      },
      fontFamily: {
        headline: ["var(--font-garamond)"],
        body: ["var(--font-manrope)"],
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    },
  },
  plugins: [],
} satisfies Config;
```

Crea `postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

Crea `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: `app/layout.tsx` con fuentes, nav y footer**

```tsx
import type { Metadata } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Astros x Chat | Tu destino escrito en las estrellas",
  description: "Conversa en privado con un oráculo astrólogo por Telegram. Suscripción mensual.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${garamond.variable} ${manrope.variable}`}>
      <body className="bg-background text-on-surface font-body">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: `components/Nav.tsx` y `components/Footer.tsx`**

Porta el `<header>` de nav y el `<footer>` desde `DiseñoBase/astros_x_chat_inicio/code.html` (líneas 38-50 y 299-325) a JSX. Cambios: los `href="#"` → rutas reales (`/`, `/planes`, `/oraculos`); botón "Iniciar Sesión" → `<Link href="/cuenta">`; en el footer, "por WhatsApp" → "por Telegram". Quita las clases `glass`/`text-glow`/blur oscuras que no calzan con el tema linen claro (la maqueta mezcla estilos oscuros por error — usa los tokens `bg-surface`, `border-primary/10`, `text-on-surface`).

- [ ] **Step 5: Verificar que arranca**

Run: `npm run dev`
Expected: `http://localhost:3000` levanta con nav y footer (páginas aún 404, se agregan luego). Sin errores de Tailwind/fuentes.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json app/ components/Nav.tsx components/Footer.tsx
git commit -m "feat(web): scaffold Next.js + Tailwind (tema linen) + layout base"
```

---

## Task 5: Wrapper server-only al backend Convex

**Files:**
- Create: `lib/backend.ts`

- [ ] **Step 1: Implementar `lib/backend.ts`**

```ts
import "server-only";

const BASE = process.env.CONVEX_SITE_URL!;

type Secret = "web" | "admin" | "none";

function headers(secret: Secret): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (secret === "web") h["X-Web-Api-Secret"] = process.env.WEB_API_SECRET!;
  if (secret === "admin") h["X-Admin-Api-Secret"] = process.env.ADMIN_API_SECRET!;
  return h;
}

// POST a una httpAction de Convex. Nunca se importa desde un Client Component (server-only).
export async function backendPost<T>(path: string, body: unknown, secret: Secret = "web"): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`backend ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// GET público (marketing). Revalida cada 60s.
export async function backendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`backend GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/backend.ts
git commit -m "feat(web): wrapper server-only a las httpActions de Convex"
```

---

## Task 6: Auth.js v5 (Credentials) + sesión + middleware

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

- [ ] **Step 1: Config de Auth.js en `lib/auth.ts`**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { backendPost } from "@/lib/backend";

const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        try {
          const user = await backendPost<{ email: string; name: string }>(
            "/api/auth/login",
            { email, password },
            "web",
          );
          return { id: user.email, email: user.email, name: user.name };
        } catch {
          return null; // credenciales inválidas → 401 en el backend
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token }) {
      token.isAdmin = adminEmails.includes(String(token.email ?? "").toLowerCase());
      return token;
    },
    session({ session, token }) {
      (session as any).isAdmin = token.isAdmin ?? false;
      return session;
    },
  },
});
```

- [ ] **Step 2: Route handler `app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: `middleware.ts` — proteger `/cuenta` y `/admin`**

```ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  if (pathname.startsWith("/cuenta") && !session) {
    return Response.redirect(new URL("/checkout", req.url));
  }
  if (pathname.startsWith("/admin") && !(session as any)?.isAdmin) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = { matcher: ["/cuenta/:path*", "/admin/:path*"] };
```

- [ ] **Step 4: Verificar**

Run: `npm run dev`
Visita `/cuenta` sin sesión → redirige a `/checkout`. Visita `/admin` sin sesión admin → redirige a `/`.
Expected: los redirects funcionan (aunque las páginas destino aún no existan del todo).

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts app/api/auth middleware.ts
git commit -m "feat(auth): Auth.js v5 Credentials + sesión JWT + middleware /cuenta /admin"
```

---

## Task 7: Landing (`/`) con oráculos y precio en vivo

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Portar la landing**

Crea `app/page.tsx` como Server Component. Porta el markup de `DiseñoBase/astros_x_chat_inicio/code.html` (hero, "cómo funciona", sección de astrólogos, planes, FAQ) a JSX, con estos cambios concretos:

- Al inicio del componente: `const { oracles, priceClp } = await backendGet<{oracles:{slug:string;name:string;specialty:string|null;bio:string|null;photoUrl:string|null}[];priceClp:number}>("/api/public/oracles");`
- **Sección de astrólogos:** reemplaza las 3 tarjetas hardcodeadas (Ana/Francisco/Teresa, líneas 137-181) por `oracles.map(...)`, enlazando cada tarjeta a `/oraculos/${o.slug}`. Con un solo oráculo publicado, se muestra uno.
- **Copy de canal:** todo "WhatsApp" → "Telegram"; la tarjeta "Por WhatsApp" (líneas 101-105) → "Por Telegram".
- **Sección de planes** (líneas 186-260): reemplaza los dos precios hardcodeados por un único plan con `priceClp` formateado: `` `$${priceClp.toLocaleString("es-CL")} CLP / mes` ``. Botón "Suscribirme" → `<Link href="/checkout">`.
- **FAQ:** conserva; ajusta la respuesta de pagos para mencionar MercadoPago en vez de "Stripe/Webpay".
- Sustituye las imágenes `lh3.googleusercontent.com` por `o.photoUrl` donde aplique; si es null, deja un placeholder de color (`bg-surface-container`).

Formateador reutilizable (arriba del archivo o en `lib/format.ts`):
```ts
export const clp = (n: number) => `$${n.toLocaleString("es-CL")} CLP`;
```

- [ ] **Step 2: Verificar**

Run: `npm run dev` → `/`
Expected: la landing muestra el oráculo "Luna" desde el backend y el precio de `settings`; todo el copy dice Telegram.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx lib/format.ts
git commit -m "feat(web): landing con oráculos y precio en vivo, copy a Telegram"
```

---

## Task 8: Planes (`/planes`)

**Files:**
- Create: `app/planes/page.tsx`

- [ ] **Step 1: Portar y simplificar**

Porta `DiseñoBase/planes_y_precios_astros_x_chat/code.html` a `app/planes/page.tsx` (Server Component). Cambios:
- Trae `priceClp` con `backendGet` (igual que Task 7).
- **Un solo plan** (no tres): elimina "Básico/Premium/Regalo" y las features irreales (Tarot, PDF carta natal, predicciones semanales). Deja las features que el backend sí cumple: "Conversación 1:1 con tu oráculo por Telegram", "Historial continuo", "Carta natal derivada de tu nacimiento", "Disponible 24/7".
- Precio = `clp(priceClp)` + "/mes". Botón → `<Link href="/checkout">`.
- Arregla los estilos oscuros heredados (la maqueta tiene `body { background-color:#0a0e1a }` en el `<style>`) — usar los tokens claros del tema.

- [ ] **Step 2: Verificar y commit**

Run: `npm run dev` → `/planes`
Expected: un plan, precio en vivo, sin features falsas.

```bash
git add app/planes/page.tsx
git commit -m "feat(web): página de planes (plan único, precio en vivo)"
```

---

## Task 9: Perfil de oráculo (`/oraculos/[slug]`)

**Files:**
- Create: `app/oraculos/[slug]/page.tsx`

- [ ] **Step 1: Portar el perfil dinámico**

Porta `DiseñoBase/perfil_ana_astr_loga/code.html` a `app/oraculos/[slug]/page.tsx`. Cambios:
- `const { oracles } = await backendGet(...); const oracle = oracles.find(o => o.slug === params.slug);` → si no existe, `notFound()`.
- Renderiza `oracle.name`, `oracle.specialty`, `oracle.bio`, `oracle.photoUrl`.
- Los CTAs "Hablar por WhatsApp" (`href="https://wa.me/yournumber"`, líneas 108 y 208) → botón "Suscribirme para hablar con {name}" → `<Link href="/checkout">` (el chat requiere suscripción; el deep-link real se entrega tras pagar).
- Testimonios/stats hardcodeados: déjalos como contenido estático de marketing (no vienen del backend) o quítalos si prefieres no mostrar métricas inventadas.

- [ ] **Step 2: Verificar y commit**

Run: `/oraculos/luna`
Expected: perfil de Luna desde el backend; CTA lleva a checkout.

```bash
git add app/oraculos/[slug]/page.tsx
git commit -m "feat(web): perfil de oráculo dinámico por slug"
```

---

## Task 10: Checkout (`/checkout`) — registro + inicio de pago

**Files:**
- Create: `app/checkout/page.tsx`
- Create: `app/checkout/actions.ts`

- [ ] **Step 1: Server Action de checkout**

Crea `app/checkout/actions.ts`:

```ts
"use server";
import { backendPost } from "@/lib/backend";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerAndCheckout(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const reg = await backendPost<{ ok: boolean; error?: string }>(
    "/api/auth/register",
    { name, email, password },
    "web",
  );
  // Si ya estaba registrado, seguimos igual (puede reintentar el pago); otros errores se lanzan.
  if (!reg.ok && reg.error && !reg.error.includes("ya registrado")) {
    throw new Error(reg.error);
  }

  await signIn("credentials", { email, password, redirect: false });

  const { initPoint } = await backendPost<{ initPoint: string; linkToken: string }>(
    "/api/checkout",
    { email },
    "web",
  );
  redirect(initPoint); // a MercadoPago
}
```

- [ ] **Step 2: Portar el formulario de checkout**

Crea `app/checkout/page.tsx`. Porta `DiseñoBase/checkout_finalizar_compra/code.html`, con cambios críticos:
- **ELIMINA por completo** el "Paso 2: Método de pago" con inputs de tarjeta/CVC (líneas 86-141). El pago ocurre en MercadoPago (redirect), **nunca** capturamos tarjeta.
- El `<form>` queda solo con "Datos de registro" (nombre, email, password) y usa la Server Action: `<form action={registerAndCheckout}>`.
- El botón "Activar mi destino" queda como submit.
- **Resumen del plan:** trae `priceClp` con `backendGet` y muéstralo. Si muestras impuestos, Chile es **IVA 19%** — o simplemente "IVA incluido" sin desglose (recomendado, evita cálculos). Corrige el "IVA (16%)" de la maqueta.
- Arregla los estilos oscuros heredados al tema claro.

- [ ] **Step 3: Verificar (sin MercadoPago aún, o con credenciales de prueba)**

Run: `/checkout`, completa el form.
Expected: crea la cuenta, inicia sesión, y (con credenciales MP de prueba) redirige a `mercadopago.cl`. Sin credenciales, el `/api/checkout` fallará en MP — verificar que hasta el registro+login funciona.

- [ ] **Step 4: Commit**

```bash
git add app/checkout/
git commit -m "feat(web): checkout (registro + redirect a MercadoPago), sin captura de tarjeta"
```

---

## Task 11: Post-pago (`/suscripcion/listo`) — estado + deep-link a Telegram

**Files:**
- Create: `app/suscripcion/listo/page.tsx`

- [ ] **Step 1: Portar la pantalla de conexión**

Crea `app/suscripcion/listo/page.tsx` (Server Component). Es la `back_url` a la que MercadoPago devuelve al usuario. Lógica:

```tsx
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.email) redirect("/checkout");
  const sub = await backendPost<{ status: string; chatId: number | null; linkToken: string | null }>(
    "/api/subscription",
    { email: session.user.email },
    "web",
  );
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const deepLink = sub.linkToken ? `https://t.me/${botUser}?start=${sub.linkToken}` : null;

  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
      {sub.status === "active" ? (
        <>
          <h1 className="text-4xl font-headline font-bold mb-4">¡Suscripción activa!</h1>
          {sub.chatId ? (
            <p>Tu chat ya está conectado. Abre Telegram y escríbele a tu oráculo.</p>
          ) : deepLink ? (
            <a href={deepLink} className="inline-block mt-6 px-8 py-4 rounded-xl bg-primary text-on-primary font-bold">
              Abrir mi chat en Telegram
            </a>
          ) : (
            <p>Tu chat ya fue enlazado. Ábrelo en Telegram.</p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-headline font-bold mb-4">Estamos confirmando tu pago…</h1>
          <p>Puede tardar unos segundos. Recarga esta página o visita tu <a href="/cuenta" className="underline text-primary">cuenta</a>.</p>
        </>
      )}
    </main>
  );
}
```

Nota: el estado puede tardar en pasar a `active` porque depende del webhook de MercadoPago; el copy lo contempla. `back_url` en el Plan 1 ya apunta a `/suscripcion/listo`.

- [ ] **Step 2: Verificar y commit**

Run: `/suscripcion/listo` (con sesión y una suscripción de prueba).
Expected: muestra el botón de deep-link a Telegram con el `linkToken`.

```bash
git add app/suscripcion/
git commit -m "feat(web): post-pago con deep-link a Telegram (linkToken)"
```

---

## Task 12: Profile (`/cuenta`) — gestionar suscripción

**Files:**
- Create: `app/cuenta/page.tsx`, `app/cuenta/actions.ts`, `components/SubscriptionManager.tsx`

- [ ] **Step 1: Server Actions de gestión**

Crea `app/cuenta/actions.ts`:

```ts
"use server";
import { auth, signOut } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function email(): Promise<string> {
  const session = await auth();
  const e = session?.user?.email;
  if (!e) throw new Error("no autenticado");
  return e;
}

export async function changeSubscription(action: "pause" | "reactivate" | "cancel") {
  await backendPost("/api/subscription/action", { email: await email(), action }, "web");
  revalidatePath("/cuenta");
}

export async function deleteAccount() {
  await backendPost("/api/subscription/delete", { email: await email() }, "web");
  await signOut({ redirectTo: "/" });
}
```

- [ ] **Step 2: `components/SubscriptionManager.tsx` (Client Component con los botones)**

```tsx
"use client";
import { changeSubscription, deleteAccount } from "@/app/cuenta/actions";

export default function SubscriptionManager({ status }: { status: string }) {
  return (
    <div className="space-y-4">
      <p>Estado: <strong>{status}</strong></p>
      <div className="flex flex-wrap gap-3">
        {status === "active" && (
          <button onClick={() => changeSubscription("pause")} className="px-5 py-3 rounded-lg border border-primary/30">Pausar</button>
        )}
        {status === "paused" && (
          <button onClick={() => changeSubscription("reactivate")} className="px-5 py-3 rounded-lg bg-primary text-on-primary">Reactivar</button>
        )}
        {(status === "active" || status === "paused") && (
          <button onClick={() => changeSubscription("cancel")} className="px-5 py-3 rounded-lg border border-tertiary/40 text-tertiary">Cancelar</button>
        )}
        <button
          onClick={() => { if (confirm("Esto borra tu cuenta y todo tu historial. ¿Seguro?")) deleteAccount(); }}
          className="px-5 py-3 rounded-lg border border-error/40 text-error"
        >
          Eliminar todos mis datos
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `app/cuenta/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import SubscriptionManager from "@/components/SubscriptionManager";

export default async function Cuenta() {
  const session = await auth();
  const sub = await backendPost<{ status: string }>(
    "/api/subscription",
    { email: session!.user!.email },
    "web",
  );
  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <h1 className="text-4xl font-headline font-bold mb-8">Mi cuenta</h1>
      {sub.status === "none" ? (
        <p>Aún no tienes una suscripción. <a href="/checkout" className="underline text-primary">Suscríbete</a>.</p>
      ) : (
        <SubscriptionManager status={sub.status} />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Verificar**

Run: inicia sesión, ve a `/cuenta`. Prueba pausar/reactivar/cancelar y verifica el estado en el dashboard de Convex. Prueba "Eliminar" → borra y cierra sesión.
Expected: los botones reflejan el estado y la eliminación borra todo (Ley 21.719).

- [ ] **Step 5: Commit**

```bash
git add app/cuenta/ components/SubscriptionManager.tsx
git commit -m "feat(web): profile con gestión de suscripción (pausar/cancelar/eliminar)"
```

---

## Task 13: Panel admin (`/admin`) — precio + perfiles

**Files:**
- Create: `app/admin/page.tsx`, `app/admin/actions.ts`, `components/PriceEditor.tsx`, `components/OracleForm.tsx`

- [ ] **Step 1: Server Actions admin (verifican rol + usan ADMIN_API_SECRET)**

Crea `app/admin/actions.ts`:

```ts
"use server";
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!(session as any)?.isAdmin) throw new Error("no autorizado");
}

export async function setPrice(priceClp: number) {
  await assertAdmin();
  await backendPost("/api/admin/config/set", { priceClp }, "admin");
  revalidatePath("/admin");
}

export async function upsertOracle(data: {
  slug: string; name: string; system: string;
  specialty?: string; bio?: string; photoUrl?: string; published: boolean; order: number;
}) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/upsert", data, "admin");
  revalidatePath("/admin");
}

export async function deleteOracle(slug: string) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/delete", { slug }, "admin");
  revalidatePath("/admin");
}
```

- [ ] **Step 2: `components/PriceEditor.tsx` (Client)**

```tsx
"use client";
import { useState } from "react";
import { setPrice } from "@/app/admin/actions";

export default function PriceEditor({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  return (
    <div className="flex items-end gap-3">
      <label className="flex flex-col text-sm">
        Precio mensual (CLP)
        <input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))}
          className="mt-1 bg-surface-container border border-outline/30 rounded-lg py-2 px-3" />
      </label>
      <button onClick={() => setPrice(value)} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">Guardar</button>
    </div>
  );
}
```

- [ ] **Step 3: `components/OracleForm.tsx` (Client) — crear/editar un perfil**

```tsx
"use client";
import { useState } from "react";
import { upsertOracle, deleteOracle } from "@/app/admin/actions";

type Oracle = { slug: string; name: string; specialty?: string | null; bio?: string | null; photoUrl?: string | null };

export default function OracleForm({ oracle }: { oracle?: Oracle }) {
  const [f, setF] = useState({
    slug: oracle?.slug ?? "", name: oracle?.name ?? "", system: "",
    specialty: oracle?.specialty ?? "", bio: oracle?.bio ?? "", photoUrl: oracle?.photoUrl ?? "",
    published: true, order: 0,
  });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-3 border border-outline/20 rounded-xl p-4">
      <input placeholder="slug" value={f.slug} onChange={set("slug")} className="w-full border rounded p-2" />
      <input placeholder="Nombre" value={f.name} onChange={set("name")} className="w-full border rounded p-2" />
      <input placeholder="Especialidad" value={f.specialty} onChange={set("specialty")} className="w-full border rounded p-2" />
      <textarea placeholder="Bio (web)" value={f.bio} onChange={set("bio")} className="w-full border rounded p-2" />
      <textarea placeholder="System prompt (chat)" value={f.system} onChange={set("system")} className="w-full border rounded p-2" />
      <input placeholder="URL foto" value={f.photoUrl} onChange={set("photoUrl")} className="w-full border rounded p-2" />
      <div className="flex gap-3">
        <button onClick={() => upsertOracle({ ...f, published: Boolean(f.published), order: Number(f.order) })}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">Guardar</button>
        {oracle && (
          <button onClick={() => { if (confirm("¿Borrar oráculo?")) deleteOracle(oracle.slug); }}
            className="px-5 py-2 rounded-lg border border-error/40 text-error">Borrar</button>
        )}
      </div>
    </div>
  );
}
```

Nota: al editar, el `system` no se precarga (el endpoint público no lo expone). Si el admin deja el campo `system` vacío en un upsert, se sobrescribiría con vacío — para Fase 1, el admin debe re-pegar el system al editar. **ponytail:** si molesta, agregar un endpoint admin que devuelva el oráculo completo (con `system`) para precargar.

- [ ] **Step 4: `app/admin/page.tsx`**

```tsx
import { backendPost } from "@/lib/backend";
import PriceEditor from "@/components/PriceEditor";
import OracleForm from "@/components/OracleForm";

export default async function Admin() {
  const config = await backendPost<{ priceClp: number; reason: string }>("/api/admin/config", {}, "admin");
  const oracles = await backendPost<any[]>("/api/admin/oracles", {}, "admin");
  return (
    <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto space-y-12">
      <section>
        <h1 className="text-3xl font-headline font-bold mb-6">Precio</h1>
        <PriceEditor current={config.priceClp} />
      </section>
      <section>
        <h2 className="text-2xl font-headline font-bold mb-6">Oráculos</h2>
        <div className="space-y-6">
          {oracles.map((o) => <OracleForm key={o.slug} oracle={o} />)}
          <div>
            <h3 className="font-bold mb-2">Nuevo oráculo</h3>
            <OracleForm />
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Verificar**

Run: inicia sesión con un email en `ADMIN_EMAILS`, ve a `/admin`. Cambia el precio → verifica en `/planes` (revalida en ~60s o recarga). Crea/edita un oráculo → aparece en la landing.
Con un email NO admin → `/admin` redirige a `/`.
Expected: precio y perfiles editables solo por admin.

- [ ] **Step 6: Commit**

```bash
git add app/admin/ components/PriceEditor.tsx components/OracleForm.tsx
git commit -m "feat(admin): panel para editar precio y perfiles de oráculos"
```

---

## Task 14: CMP de cookies (consentimiento web)

**Files:**
- Modify: `consent/config.ts` (ya existe en el repo)
- Modify: `app/layout.tsx`
- Create: `components/ConsentClient.tsx`

- [ ] **Step 1: Configurar el CMP para este sitio**

En `consent/config.ts`, ajusta `origin` y `cookieName` para este proyecto (ver README del módulo):
```ts
origin: 'astrosxchat',
cookieName: 'axc_consent',
logEndpoint: process.env.NEXT_PUBLIC_CONSENT_LOG_URL || undefined,
```
Si aún no hay GA4/Pixel, deja `scripts: []` (el banner igual pide consentimiento; se agregan tags después).

- [ ] **Step 2: Envolver la app con el provider (client boundary)**

Crea `components/ConsentClient.tsx`:
```tsx
"use client";
import ConsentProvider from "@/consent/react/ConsentProvider";
export default function ConsentClient({ children }: { children: React.ReactNode }) {
  return <ConsentProvider>{children}</ConsentProvider>;
}
```
En `app/layout.tsx`, envuelve el contenido del `<body>` con `<ConsentClient>...</ConsentClient>` (entre `<Nav/>` y `<Footer/>`, o rodeando todo). Añade en el footer un botón "Preferencias de cookies" que llame a `openSettings()` (ver README del CMP, sección 2.5).

- [ ] **Step 3: Verificar**

Run: `npm run dev` → visitante nuevo ve el banner (Aceptar todo / Rechazar todo / Configurar). La decisión se registra en el endpoint compartido con `origin: "astrosxchat"`.
Expected: banner funcional; sin trackers cargando antes del consentimiento.

- [ ] **Step 4: Commit**

```bash
git add consent/config.ts app/layout.tsx components/ConsentClient.tsx
git commit -m "feat(web): CMP de cookies (origin astrosxchat) integrado en el layout"
```

---

## Task 15: Deploy a Vercel

**Files:** ninguno de código (config de deploy).

- [ ] **Step 1: Configurar el proyecto en Vercel**

Conecta el repo. Framework preset: Next.js. Fija **todas** las env vars de la sección "Env vars del front" (marcando como server-side las que no llevan `NEXT_PUBLIC_`). `CONVEX_SITE_URL` apunta al deployment de producción de Convex.

- [ ] **Step 2: Verificar el build**

Run local: `npm run build`
Expected: build sin errores de tipos ni de rutas. Corrige imports/tipos si falla.

- [ ] **Step 3: Deploy y smoke test end-to-end**

Despliega. En producción (con MercadoPago aún en pruebas o ya real): recorrer registro → checkout → pago → volver a `/suscripcion/listo` → abrir deep-link → chatear en Telegram → gestionar en `/cuenta`. Editar precio/perfil en `/admin`.
Expected: el flujo completo funciona punta a punta.

- [ ] **Step 4: Commit final / tag**

```bash
git add -A
git commit -m "chore(web): configuración de deploy en Vercel"
```

---

## Decisiones pendientes / notas

- **Contenido legal:** las páginas Privacidad/Términos (enlazadas en el footer) las provee el cliente. Crear `app/privacidad/page.tsx` y `app/terminos/page.tsx` con ese texto cuando esté.
- **Reactivar tras cancelar en MercadoPago:** MercadoPago puede no permitir reautorizar un preapproval cancelado; en ese caso "reactivar" desde cancelado debe mandar a un nuevo checkout (hoy el botón de reactivar solo aparece desde "paused"). Verificar en la Task 11 del Plan 1.
- **Precarga del `system` al editar un oráculo:** ver ponytail en Task 13 Step 3.
- **Testimonios/stats de las maquetas:** son inventados; se dejaron como marketing estático o se quitaron. Definir con el cliente si se mantienen.
- **Estilos oscuros heredados:** varias maquetas traen CSS oscuro (`#0a0e1a`, `.glass`) que contradice el tema linen del DESIGN.md; al portar cada página, usar los tokens claros del tema.
```
