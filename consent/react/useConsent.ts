import { useContext, useSyncExternalStore } from 'react';
import { ConsentContext } from './context';
import type { Category } from '../core/types';

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent debe usarse dentro de <ConsentProvider>');
  const { manager } = ctx;

  const state = useSyncExternalStore(
    (cb) => manager.subscribe(cb),
    () => manager.getConsent(),
    () => null,
  );

  return {
    state,
    needsConsent: state === null,
    isAllowed: (category: Category) => manager.isAllowed(category),
    acceptAll: () => manager.acceptAll(),
    rejectAll: () => manager.rejectAll(),
    save: (partial: { analytics: boolean; marketing: boolean }) => manager.save(partial),
    settingsOpen: ctx.settingsOpen,
    openSettings: ctx.openSettings,
    closeSettings: ctx.closeSettings,
  };
}

export default useConsent;
