import type { ConsentConfig, ConsentState } from './types';

const ONE_YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const row = document.cookie.split('; ').find((r) => r.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : null;
}

function readMirror(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeMirror(name: string, value: string): void {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* localStorage no disponible; la cookie basta */
  }
}

function removeMirror(name: string): void {
  try {
    localStorage.removeItem(name);
  } catch {
    /* noop */
  }
}

export function readConsent(config: ConsentConfig): ConsentState | null {
  const raw = readCookie(config.cookieName) ?? readMirror(config.cookieName);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.v !== config.policyVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(config: ConsentConfig, state: ConsentState): void {
  const raw = JSON.stringify(state);
  document.cookie =
    `${config.cookieName}=${encodeURIComponent(raw)};path=/;max-age=${ONE_YEAR};SameSite=Lax`;
  writeMirror(config.cookieName, raw);
}

export function clearConsent(config: ConsentConfig): void {
  document.cookie = `${config.cookieName}=;path=/;max-age=0;SameSite=Lax`;
  removeMirror(config.cookieName);
}
