"use client";

import { useConsent } from "@/consent/react/useConsent";

export default function CookiePrefsButton() {
  const { openSettings } = useConsent();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="mt-3 block min-h-11 w-full rounded text-center text-sm leading-5 text-[var(--silente-muted)] transition-colors hover:text-[var(--silente-gold-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--silente-gold-light)] sm:text-left"
    >
      Preferencias de cookies
    </button>
  );
}
