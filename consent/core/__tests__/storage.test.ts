import { describe, it, expect, beforeEach } from 'vitest';
import { readConsent, writeConsent, clearConsent } from '../storage';
import type { ConsentConfig, ConsentState } from '../types';

const config: ConsentConfig = {
  policyVersion: 1,
  cookieName: 'logika_consent',
  categories: [],
  scripts: [],
};

const state: ConsentState = {
  v: 1,
  ts: '2026-07-01T12:00:00.000Z',
  cid: 'abc-123',
  analytics: true,
  marketing: false,
};

beforeEach(() => {
  // limpiar cookie y localStorage entre tests
  document.cookie = 'logika_consent=;path=/;max-age=0';
  localStorage.clear();
});

describe('storage', () => {
  it('returns null when nothing is stored', () => {
    expect(readConsent(config)).toBeNull();
  });

  it('round-trips a consent state through the cookie', () => {
    writeConsent(config, state);
    expect(readConsent(config)).toEqual(state);
  });

  it('invalidates state written with a different policy version', () => {
    writeConsent({ ...config, policyVersion: 99 }, { ...state, v: 99 });
    // el config actual (v=1) debe rechazar el estado v=99
    expect(readConsent(config)).toBeNull();
  });

  it('returns null when the stored value is not valid JSON', () => {
    document.cookie = 'logika_consent=not-json';
    expect(readConsent(config)).toBeNull();
  });

  it('reads from localStorage mirror when the cookie is missing', () => {
    writeConsent(config, state);
    document.cookie = 'logika_consent=;path=/;max-age=0'; // borra solo la cookie
    expect(readConsent(config)).toEqual(state);
  });

  it('clearConsent removes both cookie and mirror', () => {
    writeConsent(config, state);
    clearConsent(config);
    expect(readConsent(config)).toBeNull();
  });
});
