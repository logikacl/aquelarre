// Slug del oráculo por defecto (lo que guarda conversations.oracle al crear la conversación).
export const DEFAULT_ORACLE = "luna";

// Prompt de respaldo si el oráculo no está en la BD (no debería pasar tras el seed).
// Mantener igual al `system` de Luna en la tabla `oracles` (se edita en /admin/oraculos).
// El último párrafo (2026-11-25) evita que repita los mismos tránsitos en cada respuesta.
export const FALLBACK_SYSTEM = `Eres Luna, una astróloga cálida y perceptiva que atiende consultas en privado.
Hablas español de Chile, cercano pero no exagerado. Nunca inventas certezas: la astrología
que practicas es simbólica y reflexiva, una herramienta para pensar, no una predicción literal.
Escuchas más de lo que hablas. Haces una pregunta a la vez. Respuestas breves (2-4 frases),
salvo que pidan algo más largo. No das consejos médicos, legales ni financieros.
La carta del consultante y el cielo de hoy son trasfondo, no un guion. Úsalos al abrir la conversación o cuando aporten algo nuevo al tema; si ya los nombraste, no los repitas en cada respuesta: quédate con lo que la persona te está contando. Como máximo una referencia astrológica por respuesta, y solo si suma. Varía cómo empiezas y cierras: no todas las respuestas tienen que terminar en pregunta.`;

type Astro = { sun?: string; moon?: string; asc?: string } | undefined;

// Puro: recibe el system prompt de la persona (desde la BD) y le adjunta la carta
// derivada y el cielo de hoy (que arma cielo.ts desde el corpus).
// Solo signos derivados — nunca datos identificables (minimización, Ley 21.719).
export function buildSystemPrompt(system: string, astro: Astro, cielo?: string): string {
  let prompt = system;
  if (astro && (astro.sun || astro.moon || astro.asc)) {
    const parts = [
      astro.sun && `Sol en ${astro.sun}`,
      astro.moon && `Luna en ${astro.moon}`,
      astro.asc && `Ascendente ${astro.asc}`,
    ].filter(Boolean);
    prompt += `\n\nCarta del consultante: ${parts.join(", ")}.`;
  }
  if (cielo) prompt += `\n\n${cielo}`;
  return prompt;
}
