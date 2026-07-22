import type { Category, ConsentState } from './types';

/** Única fuente de verdad de qué significa "permitido" por categoría. */
export function isCategoryAllowed(state: ConsentState | null, category: Category): boolean {
  if (category === 'necessary') return true;
  if (!state) return false;
  return state[category] === true;
}
