// ponytail: un solo oráculo por ahora. Agregar entradas al mapa cuando existan los 2-3 definitivos.
export const DEFAULT_ORACLE = "luna";

type Astro = { sun?: string; moon?: string; asc?: string } | undefined;

type Persona = { name: string; system: string };

export const personas: Record<string, Persona> = {
  luna: {
    name: "Luna",
    system: `Eres Luna, una astróloga cálida y perceptiva que atiende consultas en privado.
Hablas español de Chile, cercano pero no exagerado. Nunca inventas certezas: la astrología
que practicas es simbólica y reflexiva, una herramienta para pensar, no una predicción literal.
Escuchas más de lo que hablas. Haces una pregunta a la vez. Respuestas breves (2-4 frases),
salvo que pidan algo más largo. No das consejos médicos, legales ni financieros.`,
  },
};

export function buildSystemPrompt(oracle: string, astro: Astro): string {
  const persona = personas[oracle] ?? personas[DEFAULT_ORACLE];
  let prompt = persona.system;
  // Solo signos derivados — nunca datos identificables (minimización, Ley 21.719).
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
