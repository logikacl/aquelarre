import React, { useEffect, useRef, useState } from 'react';
import { useConsent } from './useConsent';
import { consentConfig } from '../config';

const ConsentSettings: React.FC = () => {
  const { settingsOpen, closeSettings, save, state } = useConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Al abrir, sincroniza los toggles con el estado guardado (o false si no hay).
  useEffect(() => {
    if (settingsOpen) {
      setAnalytics(state?.analytics ?? false);
      setMarketing(state?.marketing ?? false);
    }
  }, [settingsOpen, state]);

  // Modal a11y: focus management, Escape/overlay close, focus trap.
  useEffect(() => {
    if (!settingsOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const selector =
      'button, [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const first = dialog?.querySelectorAll<HTMLElement>(selector)[0];
    (first ?? dialog)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSettings();
        return;
      }
      if (e.key === 'Tab' && dialog) {
        const items = dialog.querySelectorAll<HTMLElement>(selector);
        if (items.length === 0) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [settingsOpen, closeSettings]);

  if (!settingsOpen) return null;

  const valueFor = (id: string): boolean =>
    id === 'analytics' ? analytics : id === 'marketing' ? marketing : true;

  const setFor = (id: string, next: boolean) => {
    if (id === 'analytics') setAnalytics(next);
    if (id === 'marketing') setMarketing(next);
  };

  const handleSave = () => {
    save({ analytics, marketing });
    closeSettings();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Preferencias de cookies"
        className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6"
      >
        <h2 className="text-[1.25rem] font-bold text-logika-navy mb-1">Preferencias de cookies</h2>
        <p className="text-[0.8125rem] text-stone-500 mb-5">
          Elige qué categorías permites. Puedes cambiarlo cuando quieras.
        </p>

        <div className="space-y-4">
          {consentConfig.categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-start justify-between gap-4 border border-stone-200 rounded-lg p-4"
            >
              <div className="flex-1">
                <div className="text-[0.9375rem] font-semibold text-stone-800">{cat.label}</div>
                <div className="text-[0.8125rem] text-stone-500 mt-1">{cat.description}</div>
              </div>
              <label className="inline-flex items-center shrink-0 mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={valueFor(cat.id)}
                  disabled={cat.locked}
                  onChange={(e) => setFor(cat.id, e.target.checked)}
                />
                <span
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    valueFor(cat.id) ? 'bg-logika-blue' : 'bg-stone-300'
                  } ${cat.locked ? 'opacity-60' : 'cursor-pointer'} peer-focus:ring-2 peer-focus:ring-logika-blue`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      valueFor(cat.id) ? 'translate-x-4' : ''
                    }`}
                  />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={closeSettings}
            className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold bg-logika-navy text-white hover:bg-logika-blue transition-colors"
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentSettings;
