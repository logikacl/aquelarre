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
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-[1200px] mx-auto bg-white border border-stone-200 shadow-lg rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 text-[0.875rem] text-stone-600 leading-relaxed">
          Usamos cookies propias y de terceros para analítica y marketing. Puedes aceptarlas
          todas, rechazarlas o elegir por categoría. Consulta nuestra{' '}
          <a href="#privacidad" className="underline text-logika-navy hover:text-logika-blue">
            Política de Privacidad
          </a>
          .
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={rejectAll}
            className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Rechazar todo
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Configurar
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold bg-logika-navy text-white hover:bg-logika-blue transition-colors"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
