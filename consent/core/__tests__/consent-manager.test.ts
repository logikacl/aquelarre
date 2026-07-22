import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConsentManager } from '../consent-manager';
import type { ConsentConfig } from '../types';

const inject = vi.fn();

const config: ConsentConfig = {
  policyVersion: 1,
  cookieName: 'logika_consent',
  categories: [],
  scripts: [{ id: 'ga4', category: 'analytics', inject }],
};

beforeEach(() => {
  document.cookie = 'logika_consent=;path=/;max-age=0';
  localStorage.clear();
  inject.mockClear();
  vi.stubGlobal('location', { reload: vi.fn() });
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true } as Response)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('consent manager', () => {
  it('needs consent and denies everything for a fresh visitor', () => {
    const m = createConsentManager(config);
    expect(m.needsConsent()).toBe(true);
    expect(m.isAllowed('necessary')).toBe(true);
    expect(m.isAllowed('analytics')).toBe(false);
    expect(m.isAllowed('marketing')).toBe(false);
  });

  it('acceptAll allows analytics and marketing and injects scripts', () => {
    const m = createConsentManager(config);
    m.acceptAll();
    expect(m.isAllowed('analytics')).toBe(true);
    expect(m.isAllowed('marketing')).toBe(true);
    expect(m.needsConsent()).toBe(false);
    expect(inject).toHaveBeenCalledTimes(1);
  });

  it('rejectAll denies non-necessary categories', () => {
    const m = createConsentManager(config);
    m.rejectAll();
    expect(m.isAllowed('analytics')).toBe(false);
    expect(m.needsConsent()).toBe(false);
    expect(inject).not.toHaveBeenCalled();
  });

  it('save persists a partial decision and keeps the same cid', () => {
    const m = createConsentManager(config);
    m.acceptAll();
    const cid1 = m.getConsent()!.cid;
    m.save({ analytics: true, marketing: false });
    expect(m.isAllowed('marketing')).toBe(false);
    expect(m.getConsent()!.cid).toBe(cid1);
  });

  it('notifies subscribers on decision', () => {
    const m = createConsentManager(config);
    const listener = vi.fn();
    m.subscribe(listener);
    m.acceptAll();
    expect(listener).toHaveBeenCalled();
  });

  it('POSTs the decision to logEndpoint when configured', () => {
    const m = createConsentManager({ ...config, logEndpoint: 'https://x.convex.site/consent' });
    m.acceptAll();
    expect(fetch).toHaveBeenCalledWith(
      'https://x.convex.site/consent',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('includes the configured origin in the logged payload', () => {
    const m = createConsentManager({
      ...config,
      logEndpoint: 'https://x.convex.site/consent',
      origin: 'logika.cl',
    });
    m.acceptAll();
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.origin).toBe('logika.cl');
  });

  it('reloads existing consent from storage on a second manager', () => {
    createConsentManager(config).acceptAll();
    const m2 = createConsentManager(config);
    expect(m2.needsConsent()).toBe(false);
    expect(m2.isAllowed('analytics')).toBe(true);
  });
});
