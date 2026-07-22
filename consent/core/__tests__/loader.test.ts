import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyConsent } from '../loader';
import type { ConsentConfig, ConsentState, ScriptDef } from '../types';

const gaInject = vi.fn();
const gaCleanup = vi.fn();
const pxInject = vi.fn();
const pxCleanup = vi.fn();

const scripts: ScriptDef[] = [
  { id: 'ga4', category: 'analytics', inject: gaInject, cleanup: gaCleanup },
  { id: 'pixel', category: 'marketing', inject: pxInject, cleanup: pxCleanup },
];

const config: ConsentConfig = {
  policyVersion: 1,
  cookieName: 'logika_consent',
  categories: [],
  scripts,
};

function state(analytics: boolean, marketing: boolean): ConsentState {
  return { v: 1, ts: 't', cid: 'c', analytics, marketing };
}

let reloadMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  gaInject.mockClear();
  gaCleanup.mockClear();
  pxInject.mockClear();
  pxCleanup.mockClear();
  reloadMock = vi.fn();
  vi.stubGlobal('location', { reload: reloadMock });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyConsent', () => {
  it('injects a script when its category becomes allowed', () => {
    applyConsent(config, null, state(true, false));
    expect(gaInject).toHaveBeenCalledTimes(1);
    expect(pxInject).not.toHaveBeenCalled();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('does nothing when state is unchanged', () => {
    const s = state(true, true);
    applyConsent(config, s, s);
    expect(gaInject).not.toHaveBeenCalled();
    expect(pxInject).not.toHaveBeenCalled();
  });

  it('cleans up and reloads when a category is revoked', () => {
    applyConsent(config, state(true, true), state(false, true));
    expect(gaCleanup).toHaveBeenCalledTimes(1);
    expect(pxCleanup).not.toHaveBeenCalled();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
