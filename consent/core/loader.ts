import type { ConsentConfig, ConsentState } from './types';
import { isCategoryAllowed } from './policy';

/**
 * Aplica el diff de consentimiento a los scripts:
 * - categoría que pasa a permitida  -> inject()
 * - categoría que pasa a denegada    -> cleanup() + reload
 * Idempotente si no hay cambios.
 */
export function applyConsent(
  config: ConsentConfig,
  prev: ConsentState | null,
  next: ConsentState,
): void {
  let mustReload = false;

  for (const script of config.scripts) {
    const wasAllowed = isCategoryAllowed(prev, script.category);
    const nowAllowed = isCategoryAllowed(next, script.category);

    if (nowAllowed && !wasAllowed) {
      script.inject();
    } else if (!nowAllowed && wasAllowed) {
      script.cleanup?.();
      mustReload = true;
    }
  }

  if (mustReload && typeof location !== 'undefined') {
    location.reload();
  }
}
