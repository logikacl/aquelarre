// Cuota diaria de mensajes a Luna. Puro (sin imports de Convex) para poder testearlo.
// El límite es de cada plan (tabla `plans`, ver convex/planRules.ts).

// Día calendario en Chile (mismo idioma que churn.ts: buckets en hora local, no UTC).
export const chileDay = (at: number = Date.now()) =>
  new Date(at).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

// Consultas usadas hoy: el contador solo cuenta si es del día en curso.
export const usedToday = (day: string, quotaDay?: string, quotaCount?: number) =>
  quotaDay === day ? quotaCount ?? 0 : 0;
