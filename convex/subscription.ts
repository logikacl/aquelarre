// Lógica pura de suscripción (sin Convex) → testeable con subscription.check.ts.

export type SubStatus = "pending" | "active" | "ending" | "cancelled";

// Deep-link: Telegram envía "/start <param>". Devuelve el param o null.
export function parseStartToken(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/);
  return m?.[1] ?? null;
}

// Evento de webhook de Reveniu + estado actual → estado nuevo, o null si no cambia nada.
// Recibe el estado actual porque el orden de llegada de los webhooks no está garantizado y
// hay transiciones que no deben ocurrir hacia atrás.
export function nextStatus(event: string, current: SubStatus): SubStatus | null {
  switch (event) {
    case "subscription_activated":
      return "active";
    case "subscription_payment_succeeded":
      // Confirma un cobro, pero no resucita una suscripción dada de baja: si el usuario
      // canceló y el cobro del período en curso llega después, mandaría el estado atrás.
      return current === "ending" || current === "cancelled" ? null : "active";
    case "subscription_renewal_cancelled":
      return "ending"; // sigue activa hasta el fin del período pagado
    case "subscription_deactivated":
      return "cancelled";
    default:
      // subscription_payment_in_recovery cae acá a propósito: Reveniu pide no suspender
      // el servicio mientras su motor de reintentos trabaja. Los eventos desconocidos
      // también — un evento nuevo de su lado no puede mover el estado de nadie.
      return null;
  }
}

// El chat pasa si la suscripción está activa o en su último período pagado.
export function subscriptionAllows(sub: { status: SubStatus } | null | undefined): boolean {
  return sub?.status === "active" || sub?.status === "ending";
}

// Token de enlace de un solo uso. 24 chars alfanuméricos (subconjunto de lo que
// Telegram permite en el start param, [A-Za-z0-9_-]).
export function newLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
