import type { Category, ConsentConfig, ConsentState } from './types';
import { readConsent, writeConsent } from './storage';
import { applyConsent } from './loader';
import { isCategoryAllowed } from './policy';

export interface ConsentManager {
  getConsent(): ConsentState | null;
  isAllowed(category: Category): boolean;
  needsConsent(): boolean;
  acceptAll(): void;
  rejectAll(): void;
  save(partial: { analytics: boolean; marketing: boolean }): void;
  subscribe(listener: () => void): () => void;
  /** Aplica el consentimiento ya almacenado al cargar (inyecta scripts concedidos). */
  init(): void;
}

function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fallback abajo */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function logDecision(config: ConsentConfig, state: ConsentState): void {
  if (!config.logEndpoint) return;
  try {
    void fetch(config.logEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ts: state.ts,
        cid: state.cid,
        origin: config.origin ?? (typeof location !== 'undefined' ? location.hostname : ''),
        decision: { analytics: state.analytics, marketing: state.marketing },
        policyVersion: state.v,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    }).catch(() => {
      /* falla en silencio: no bloquea la UX */
    });
  } catch {
    /* noop */
  }
}

export function createConsentManager(config: ConsentConfig): ConsentManager {
  let state: ConsentState | null = readConsent(config);
  const listeners = new Set<() => void>();

  function notify(): void {
    listeners.forEach((l) => l());
  }

  function buildState(analytics: boolean, marketing: boolean): ConsentState {
    return {
      v: config.policyVersion,
      ts: new Date().toISOString(),
      cid: state?.cid ?? generateId(),
      analytics,
      marketing,
    };
  }

  function commit(next: ConsentState): void {
    const prev = state;
    state = next;
    writeConsent(config, next);
    applyConsent(config, prev, next);
    logDecision(config, next);
    notify();
  }

  return {
    getConsent: () => state,
    isAllowed: (category) => isCategoryAllowed(state, category),
    needsConsent: () => state === null,
    acceptAll: () => commit(buildState(true, true)),
    rejectAll: () => commit(buildState(false, false)),
    save: (partial) => commit(buildState(partial.analytics, partial.marketing)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    init: () => {
      if (state) applyConsent(config, null, state);
    },
  };
}
