// Lógica pura de suscripción (sin Convex) → testeable con subscription.check.ts.
import type { MpStatus } from "./mercadopago";

export type SubStatus = "pending" | "active" | "paused" | "cancelled";

// Deep-link: Telegram envía "/start <param>". Devuelve el param o null.
export function parseStartToken(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/);
  return m?.[1] ?? null;
}

// Estado de MercadoPago → nuestro estado interno.
export function mapPreapprovalStatus(mp: MpStatus): SubStatus {
  switch (mp) {
    case "authorized":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

// El chat solo pasa si la suscripción existe y está activa.
export function subscriptionAllows(sub: { status: SubStatus } | null | undefined): boolean {
  return sub?.status === "active";
}

// Token de enlace de un solo uso. 24 chars alfanuméricos (subconjunto de lo que
// Telegram permite en el start param, [A-Za-z0-9_-]).
export function newLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
