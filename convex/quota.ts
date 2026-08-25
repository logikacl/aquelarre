// Cuota diaria de consultas al oráculo. Puro (sin imports de Convex) para poder testearlo.
export const DAILY_LIMIT = 10;

// Día calendario en Chile (mismo idioma que churn.ts: buckets en hora local, no UTC).
export const chileDay = (at: number = Date.now()) =>
  new Date(at).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

// Consultas usadas hoy: el contador solo cuenta si es del día en curso.
export const usedToday = (day: string, quotaDay?: string, quotaCount?: number) =>
  quotaDay === day ? quotaCount ?? 0 : 0;
