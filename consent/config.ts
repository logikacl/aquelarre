import type { ConsentConfig } from './core/types';

export const consentConfig: ConsentConfig = {
  // 2 desde la marca Silente (2026-11-22): cookie y origen nuevos, así que se vuelve a preguntar.
  policyVersion: 2,
  cookieName: 'silente_consent',
  logEndpoint: process.env.NEXT_PUBLIC_CONSENT_LOG_URL || undefined,
  origin: 'silente',
  categories: [
    {
      id: 'necessary',
      label: 'Necesarias',
      description:
        'Imprescindibles para el funcionamiento del sitio (seguridad del formulario y esta preferencia). Siempre activas.',
      locked: true,
    },
    {
      id: 'analytics',
      label: 'Analítica',
      description:
        'Nos ayudan a entender cómo se usa el sitio de forma agregada.',
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description: 'Permiten medir campañas y mostrar anuncios relevantes.',
    },
  ],
  // ponytail: sin tags de analítica/marketing todavía; el banner sigue pidiendo
  // consentimiento igual. Agrega ScriptDef aquí (ver README) cuando haya un tag que gatear.
  scripts: [],
};
