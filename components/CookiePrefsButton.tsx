"use client";

import { useConsent } from "@/consent/react/useConsent";

export default function CookiePrefsButton() {
  const { openSettings } = useConsent();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="text-on-surface-variant hover:text-primary transition-colors text-sm"
    >
      Preferencias de cookies
    </button>
  );
}
