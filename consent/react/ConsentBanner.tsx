"use client";

import React from 'react';
import { useConsent } from './useConsent';

const ConsentBanner: React.FC = () => {
  const { needsConsent, settingsOpen, acceptAll, rejectAll, openSettings } = useConsent();

  // No mostrar si ya hay decisión, o si el panel de detalle está abierto.
  if (!needsConsent || settingsOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de privacidad"
      className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 rounded-3xl border border-[rgba(213,170,75,.38)] bg-[rgba(18,27,38,.96)] p-5 text-[var(--silente-ivory)] shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:gap-6 md:p-6">
        <div className="flex-1 text-sm leading-relaxed text-[var(--silente-muted)]">
          Usamos cookies propias y de terceros para analítica y marketing. Puedes aceptarlas
          todas, rechazarlas o elegir por categoría. Consulta nuestra{' '}
          <a href="/privacidad" className="text-[var(--silente-gold-light)] underline underline-offset-4">
            Política de Privacidad
          </a>
          .
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={rejectAll}
            className="min-h-11 rounded-full border border-[var(--silente-border)] px-5 text-sm font-medium text-[var(--silente-ivory)] transition-colors hover:border-[var(--silente-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--silente-gold-light)]"
          >
            Rechazar todo
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="min-h-11 rounded-full border border-[var(--silente-border)] px-5 text-sm font-medium text-[var(--silente-ivory)] transition-colors hover:border-[var(--silente-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--silente-gold-light)]"
          >
            Configurar
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="min-h-11 rounded-full bg-[var(--silente-gold)] px-5 text-sm font-semibold text-[var(--silente-night)] transition-colors hover:bg-[var(--silente-gold-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--silente-gold-light)]"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
