// Slug del oráculo por defecto (lo que guarda conversations.oracle al crear la conversación).
export const DEFAULT_ORACLE = "luna";

// Prompt de respaldo si el oráculo no está en la BD (no debería pasar tras el seed).
export const FALLBACK_SYSTEM = `Eres Luna, una astróloga cálida y perceptiva que atiende consultas en privado.
Hablas español de Chile, cercano pero no exagerado. Nunca inventas certezas: la astrología
que practicas es simbólica y reflexiva, una herramienta para pensar, no una predicción literal.
Escuchas más de lo que hablas. Haces una pregunta a la vez. Respuestas breves (2-4 frases),
salvo que pidan algo más largo. No das consejos médicos, legales ni financieros.`;

type Astro = { sun?: string; moon?: string; asc?: string } | undefined;

// Puro: recibe el system prompt de la persona (desde la BD) y le adjunta la carta derivada.
// Solo signos derivados — nunca datos identificables (minimización, Ley 21.719).
export function buildSystemPrompt(system: string, astro: Astro): string {
  let prompt = system;
  if (astro && (astro.sun || astro.moon || astro.asc)) {
    const parts = [
      astro.sun && `Sol en ${astro.sun}`,
      astro.moon && `Luna en ${astro.moon}`,
      astro.asc && `Ascendente ${astro.asc}`,
    ].filter(Boolean);
    prompt += `\n\nCarta del consultante: ${parts.join(", ")}.`;
  }
  return prompt;
}
