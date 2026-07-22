import type { ConsentConfig } from './core/types';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA4_ID = 'G-2G9JKCB2B2';
const PIXEL_ID = '826486843709590';

/** Borra cookies por nombre en el dominio actual y su variante con punto. */
function deleteCookies(names: string[]): void {
  const host = typeof location !== 'undefined' ? location.hostname : '';
  for (const name of names) {
    for (const domain of ['', `;domain=${host}`, `;domain=.${host}`]) {
      document.cookie = `${name}=;path=/;max-age=0${domain}`;
    }
  }
}

function injectGA4(): void {
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
}

function cleanupGA4(): void {
  deleteCookies(['_ga', '_gid', `_ga_${GA4_ID.replace('G-', '')}`]);
}

function injectPixel(): void {
  if (window.fbq) return;
  /* Snippet oficial de Facebook Pixel, inyectado bajo consentimiento. */
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    // @ts-expect-error - snippet de terceros con tipado laxo
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

function cleanupPixel(): void {
  deleteCookies(['_fbp', '_fbc']);
}

export const consentConfig: ConsentConfig = {
  policyVersion: 1,
  cookieName: 'logika_consent',
  logEndpoint: import.meta.env.VITE_CONSENT_LOG_URL || undefined,
  origin: 'logika.cl',
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
        'Nos ayudan a entender cómo se usa el sitio de forma agregada (Google Analytics).',
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description:
        'Permiten medir campañas y mostrar anuncios relevantes (Meta / Facebook Pixel).',
    },
  ],
  scripts: [
    { id: 'ga4', category: 'analytics', inject: injectGA4, cleanup: cleanupGA4 },
    { id: 'pixel', category: 'marketing', inject: injectPixel, cleanup: cleanupPixel },
  ],
};
