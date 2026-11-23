"use client";

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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Preferencias de cookies"
        className="my-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--silente-border)] bg-[var(--silente-night)] p-6 text-[var(--silente-ivory)] shadow-2xl md:p-8"
      >
        <h2 className="mb-1 text-2xl font-semibold">Preferencias de cookies</h2>
        <p className="mb-6 text-sm leading-6 text-[var(--silente-muted)]">
          Elige qué categorías permites. Puedes cambiarlo cuando quieras.
        </p>

        <div className="space-y-4">
          {consentConfig.categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-start justify-between gap-5 rounded-2xl border border-[var(--silente-border)] bg-[rgba(23,35,49,.55)] p-4"
            >
              <div className="flex-1">
                <div className="font-semibold">{cat.label}</div>
                <div className="mt-1 text-sm leading-6 text-[var(--silente-muted)]">{cat.description}</div>
              </div>
              <label className="inline-flex min-h-11 shrink-0 items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={valueFor(cat.id)}
                  disabled={cat.locked}
                  onChange={(e) => setFor(cat.id, e.target.checked)}
                />
                <span
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    valueFor(cat.id) ? 'bg-[var(--silente-gold)]' : 'bg-white/20'
                  } ${cat.locked ? 'opacity-60' : 'cursor-pointer'} peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--silente-gold-light)]`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--silente-night)] rounded-full transition-transform ${
                      valueFor(cat.id) ? 'translate-x-4' : ''
                    }`}
                  />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={closeSettings}
            className="min-h-11 rounded-full border border-[var(--silente-border)] px-5 text-sm font-medium text-[var(--silente-ivory)] transition-colors hover:border-[var(--silente-gold)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-11 rounded-full bg-[var(--silente-gold)] px-5 text-sm font-semibold text-[var(--silente-night)] transition-colors hover:bg-[var(--silente-gold-light)]"
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentSettings;
