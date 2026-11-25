// Reglas puras de planes (sin Convex) → testeables con plans.check.ts.

export type Plan = {
  slug: string;
  name: string;
  priceClp: number;
  dailyLimit: number;
  bullets: string[];
  published: boolean;
  order: number;
  reveniuPlanId?: number;
};

// Los rangos del plan de monto abierto en Reveniu (custom_amount_min/max). Fuera de ahí la
// suscripción se rechaza allá, así que se rechaza acá antes.
export const MONTO_MIN = 500;
export const MONTO_MAX = 200000;
// Cuota histórica (DAILY_LIMIT antes de los planes). Es la del plan por defecto.
export const CUOTA_POR_DEFECTO = 10;

export function validarPlan(p: Omit<Plan, "reveniuPlanId">): string | null {
  if (!/^[a-z0-9-]{2,32}$/.test(p.slug)) return "slug inválido: minúsculas, números y guiones";
  if (!p.name.trim()) return "el nombre es obligatorio";
  if (!Number.isInteger(p.priceClp) || p.priceClp < MONTO_MIN || p.priceClp > MONTO_MAX)
    return `precio inválido: entero entre ${MONTO_MIN} y ${MONTO_MAX}`;
  if (!Number.isInteger(p.dailyLimit) || p.dailyLimit < 1 || p.dailyLimit > 500)
    return "mensajes por día inválido: entero entre 1 y 500";
  return null;
}

export const planPorDefecto = (priceClp: number, reveniuPlanId?: number): Plan => ({
  slug: "silente",
  name: "Conversación privada",
  priceClp,
  dailyLimit: CUOTA_POR_DEFECTO,
  bullets: [
    "Disponible 24 horas al día",
    "Historial de conversaciones guardado",
    "Cancela cuando quieras",
    "Carta natal personalizada",
    "Conversaciones privadas",
  ],
  published: true,
  order: 0,
  reveniuPlanId,
});

// El plan pedido si está publicado; si no, el primero publicado. Un plan oculto no se vende.
export function elegirPlan<T extends Plan>(plans: T[], slug: string | undefined): T | null {
  const publicados = plans.filter((p) => p.published).sort((a, b) => a.order - b.order);
  return publicados.find((p) => p.slug === slug) ?? publicados[0] ?? null;
}

export const bulletsVisibles = (p: Pick<Plan, "dailyLimit" | "bullets">) => [
  `${p.dailyLimit} mensajes al día por WhatsApp`,
  ...p.bullets,
];
