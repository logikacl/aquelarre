# CMP — Módulo de Consentimiento (GDPR) reutilizable

Consent Management Platform hecho en casa, portable entre proyectos. Bloquea trackers
(GA4, Meta Pixel, etc.) hasta obtener consentimiento explícito, con banner de 3 opciones
y panel de preferencias por categoría. Registra cada decisión en un backend (Convex) que
puede **compartirse entre proyectos** gracias al campo `origin`.

Cumple el estándar europeo: opt-in sin casillas pre-marcadas, "Rechazar todo" tan fácil
como "Aceptar todo", retiro del consentimiento en cualquier momento, re-consentimiento
versionado y minimización de datos (sin IP).

Implementado y en producción en **logika.cl** (2026-07-01).

---

## 1. Qué incluye

```
consent/
├── core/                    # TypeScript puro, SIN dependencias de React → portable
│   ├── types.ts             # Category, ConsentState, ScriptDef, ConsentConfig
│   ├── storage.ts           # cookie versionada + espejo localStorage
│   ├── policy.ts            # isCategoryAllowed() — única fuente de verdad
│   ├── loader.ts            # applyConsent() — inyecta/limpia scripts según el diff
│   └── consent-manager.ts   # createConsentManager() — estado + logging + subscribe
├── config.ts                # ← ÚNICO archivo que editas por proyecto
├── react/                   # capa fina de React
│   ├── context.ts
│   ├── ConsentProvider.tsx  # provider + monta banner y panel
│   ├── useConsent.ts        # hook: acceptAll / rejectAll / save / isAllowed / openSettings
│   ├── ConsentBanner.tsx    # Aceptar todo / Rechazar todo / Configurar
│   └── ConsentSettings.tsx  # panel con toggles por categoría (a11y: focus trap, Esc, click-fuera)
└── core/__tests__/          # tests Vitest del core

convex/                      # backend de logging (opcional pero recomendado)
├── schema.ts                # tabla consent_log (con índice by_origin)
├── consent.ts               # internalMutation record
└── http.ts                  # httpAction POST /consent
```

El core no importa React: puedes usar `createConsentManager` en un sitio vanilla JS,
Vue, Svelte, etc. La carpeta `react/` es solo azúcar para proyectos React.

---

## 2. Instalación en un proyecto nuevo (React + Vite)

1. **Copia** las carpetas `consent/` y (si usarás logging) `convex/` a la raíz del proyecto.

2. **Dependencias**:
   ```bash
   npm install convex               # solo si usarás el logging en Convex
   npm install -D vitest jsdom      # solo si quieres correr los tests del core
   ```
   El core y la capa React no tienen otras dependencias más allá de `react`.

3. **Envuelve tu app** en el provider (normalmente en `App.tsx`):
   ```tsx
   import ConsentProvider from './consent/react/ConsentProvider';

   export default function App() {
     return (
       <ConsentProvider>
         {/* ...tu sitio... */}
       </ConsentProvider>
     );
   }
   ```
   El `<ConsentProvider>` monta el banner y el panel automáticamente.

4. **Quita los trackers hardcodeados** de `index.html` (GA4, Pixel, cualquier `<script>` de
   analytics/marketing, y los `<noscript>` de pixel). Si siguen en el HTML, cargan **antes**
   del consentimiento y rompes el cumplimiento. El módulo los inyecta cuando corresponde.

5. **Link de "Preferencias"** para poder retirar el consentimiento (requisito GDPR). En tu
   footer:
   ```tsx
   import { useConsent } from './consent/react/useConsent';

   const { openSettings } = useConsent();
   // ...
   <button type="button" onClick={openSettings}>Preferencias de cookies</button>
   ```

6. **Variable de entorno** (si usas logging), en `.env.local` y en el hosting (p.ej. CF Pages):
   ```
   VITE_CONSENT_LOG_URL=https://<deployment>.convex.site/consent
   ```
   Si la dejas vacía, el CMP funciona igual pero no registra en el backend.

---

## 3. Configuración: `consent/config.ts` (el único archivo por-proyecto)

Aquí defines quién eres y qué scripts gateas. Ejemplo real (Logika):

```ts
export const consentConfig: ConsentConfig = {
  policyVersion: 1,                                   // súbelo para forzar re-consentimiento
  cookieName: 'logika_consent',                       // nombre de la cookie (único por sitio)
  logEndpoint: import.meta.env.VITE_CONSENT_LOG_URL || undefined,
  origin: 'logika.cl',                                // ← identifica el proyecto en Convex
  categories: [
    { id: 'necessary', label: 'Necesarias', description: '...', locked: true },
    { id: 'analytics', label: 'Analítica',  description: '...' },
    { id: 'marketing', label: 'Marketing',  description: '...' },
  ],
  scripts: [
    { id: 'ga4',   category: 'analytics', inject: injectGA4,   cleanup: cleanupGA4 },
    { id: 'pixel', category: 'marketing', inject: injectPixel, cleanup: cleanupPixel },
  ],
};
```

**Lo que cambias por proyecto:**
- `cookieName` y `origin` → únicos por sitio.
- Los IDs de GA4 / Pixel dentro de `injectGA4` / `injectPixel` (constantes al inicio del archivo).
- `logEndpoint` → deja el env var; solo cambia el valor del env por proyecto.

### Categorías
Las categorías del tipo `Category` son `'necessary' | 'analytics' | 'marketing'`. `necessary`
va siempre activa (`locked: true`) y no es editable. Para añadir una categoría nueva (p.ej.
`'functional'`), amplía el union en `core/types.ts` y agrégala a `categories` y a `policy` si
aplica.

### Añadir/gatear un script nuevo
Un `ScriptDef` tiene `id`, `category` (no puede ser `necessary`), `inject()` y `cleanup?()`:

```ts
function injectHotjar() {
  if (document.getElementById('hj-script')) return;   // idempotente
  // ...crear e insertar el <script>...
}
function cleanupHotjar() {
  deleteCookies(['_hj*']);                              // cookies que borra al revocar
}

// en scripts:
{ id: 'hotjar', category: 'analytics', inject: injectHotjar, cleanup: cleanupHotjar }
```

- `inject()` debe ser **idempotente** (guardar contra doble inyección).
- `cleanup()` borra las cookies del tag; al revocar, el loader llama `cleanup()` y hace
  `location.reload()` para que el tag deje de inicializarse.

---

## 4. Backend Convex (logging) — con reuso entre proyectos

El valor de hoy: **una sola tabla `consent_log` sirve para varios sitios**, distinguidos por
`origin`.

### Opción A — Reutilizar el deployment existente (recomendado para proyectos del mismo dueño)
No despliegues nada nuevo. Solo apunta el otro proyecto al mismo endpoint y ponle su `origin`:

```
# .env.local del nuevo proyecto
VITE_CONSENT_LOG_URL=https://robust-snake-904.convex.site/consent
```
```ts
// consent/config.ts del nuevo proyecto
origin: 'otro-proyecto.cl',
```
Los registros de todos los proyectos caen en la misma tabla; filtras por `origin` (hay índice
`by_origin`). No hace falta tocar `convex/` en el nuevo proyecto.

### Opción B — Deployment propio
Copia `convex/`, y en el proyecto:
```bash
npx convex dev      # desarrollo (login interactivo, genera convex/_generated)
npx convex deploy   # producción
```
El endpoint queda en `https://<deployment>.convex.site/consent`. Añade `convex/_generated` al
`.gitignore` (se regenera).

### Forma del registro guardado
```json
{
  "ts": "2026-07-01T12:00:00.000Z",
  "cid": "uuid-anónimo",
  "origin": "logika.cl",
  "decision": { "analytics": true, "marketing": false },
  "policyVersion": 1,
  "userAgent": "..."
}
```
Sin IP ni PII (minimización). `cid` es un UUID aleatorio para correlacionar decisiones del
mismo navegador.

---

## 5. API del hook `useConsent()`

```ts
const {
  state,          // ConsentState | null
  needsConsent,   // boolean (true = aún no decide → banner visible)
  isAllowed,      // (category) => boolean
  acceptAll,      // () => void
  rejectAll,      // () => void
  save,           // ({ analytics, marketing }) => void
  openSettings,   // abre el panel de preferencias
  closeSettings,
  settingsOpen,
} = useConsent();
```

Para condicionar lógica propia a una categoría:
```ts
if (isAllowed('analytics')) { /* ...evento propio... */ }
```

---

## 6. Cómo funciona el gating (importante)

- **Visitante nuevo**: sin cookie → banner visible → GA4/Pixel NO cargan.
- **Aceptar / guardar con categoría permitida**: el loader llama `inject()` en caliente (sin recargar).
- **Revocar** (apagar una categoría antes permitida): el loader llama `cleanup()` (borra cookies)
  y hace `location.reload()` para que el tag no vuelva a inicializarse.
- **Visitante que vuelve**: `ConsentProvider` llama `manager.init()` y reinyecta lo ya consentido.
- **Cambio de política**: sube `policyVersion`; la cookie vieja se invalida y se vuelve a preguntar.

La cookie (`cookieName`) dura 12 meses, `SameSite=Lax`, con espejo en `localStorage`.

---

## 7. Tests

```bash
npm test          # vitest run — cubre storage, policy/loader, manager (incl. origin en el payload)
```
Requiere `vitest` + `jsdom` (devDependencies) y un `vitest.config.ts` con
`test.environment: 'jsdom'`. Los componentes React se verifican manualmente en el navegador.

---

## 8. Checklist de cumplimiento (GDPR / ePrivacy)

- [ ] GA4/Pixel/otros trackers **fuera** de `index.html` (no cargan pre-consentimiento).
- [ ] Sin casillas pre-marcadas (analytics/marketing arrancan en `false`).
- [ ] "Rechazar todo" con la misma prominencia que "Aceptar todo".
- [ ] Link de "Preferencias" siempre accesible (retiro del consentimiento).
- [ ] `policyVersion` correcto; súbelo si cambian categorías o proveedores.
- [ ] Política de Privacidad/Cookies redactada y enlazada (el módulo NO la incluye).
- [ ] Analytics cookieless "exentos" (p.ej. Cloudflare RUM): documentar o gatear según postura.
- [ ] Endpoint de logging sin PII/IP; CORS acotado a los orígenes de producción si es público.

---

## 9. Gotchas

- **No dejes trackers en `index.html`** — es el error más común; rompe el prior-blocking.
- **`inject()` idempotente** — se puede llamar en `init()` y luego en un cambio de consentimiento.
- **`cleanup()` borra cookies del tag** — lista los nombres reales (GA usa `_ga`, `_ga_<id>`,
  `_gid`; Meta usa `_fbp`, `_fbc`).
- **Revocar recarga la página** — es intencional (desmontar un tag ya inicializado no es fiable).
- **`convex/_generated`** — gitignóralo; lo regenera `convex dev`/`deploy`.
- **CORS de `convex/http.ts`** — por defecto es permisivo (refleja el Origin) para facilitar
  pruebas locales; acótalo a tus dominios de producción si te importa.

---

## 10. Origen de este módulo

Diseño y plan de implementación:
- `docs/superpowers/specs/2026-07-01-cmp-consent-gdpr-design.md`
- `docs/superpowers/plans/2026-07-01-cmp-consent-gdpr.md`
