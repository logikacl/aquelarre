// Reglas puras del monitoreo de costos y capacidad (sin Convex) → testeables con monitor.check.ts.

export type Lectura = {
  fireworks: { tokens: number; usd: number; porModelo: Record<string, number> } | { error: string };
  whatsapp: { quality: string; status: string; limite: string } | { error: string };
  web: { status: number; ms: number } | { error: string };
  convex: { conversaciones: number; mensajes: number };
};

export type Umbrales = { usdDia: number; tokensDia: number; mensajes: number };

// Cada string devuelto es un problema que merece alerta. Lista vacía = todo en orden.
export function evaluar(l: Lectura, u: Umbrales): string[] {
  const p: string[] = [];
  if ("error" in l.fireworks) p.push(`Fireworks: no se pudo leer el consumo (${l.fireworks.error})`);
  else {
    if (l.fireworks.usd > u.usdDia) p.push(`Fireworks: gasto 24 h US$${l.fireworks.usd.toFixed(2)} > US$${u.usdDia}`);
    if (l.fireworks.tokens > u.tokensDia) p.push(`Fireworks: ${l.fireworks.tokens} tokens en 24 h > ${u.tokensDia}`);
  }
  if ("error" in l.whatsapp) p.push(`WhatsApp: no se pudo leer el número (${l.whatsapp.error})`);
  else {
    if (l.whatsapp.status !== "CONNECTED") p.push(`WhatsApp: número en estado ${l.whatsapp.status}`);
    // GREEN es lo normal; YELLOW/RED anticipan bajadas de límite o bloqueo del número.
    if (l.whatsapp.quality !== "GREEN" && l.whatsapp.quality !== "UNKNOWN")
      p.push(`WhatsApp: calidad ${l.whatsapp.quality}`);
  }
  if ("error" in l.web) p.push(`Web (Vercel): no responde (${l.web.error})`);
  else if (l.web.status !== 200) p.push(`Web (Vercel): responde HTTP ${l.web.status}`);
  if (l.convex.mensajes > u.mensajes)
    p.push(`Convex: ${l.convex.mensajes} mensajes guardados > ${u.mensajes} (revisar almacenamiento del plan)`);
  return p;
}

// Suma la respuesta de GET /v1/accounts/{id}/billingUsage de Fireworks.
// Los contadores de tokens llegan como string; costNanoUsd como número.
export function sumarFireworks(data: {
  serverlessCosts?: { modelName?: string; promptTokens?: string; completionTokens?: string; costNanoUsd?: number }[];
}) {
  let tokens = 0;
  let nano = 0;
  const porModelo: Record<string, number> = {};
  for (const c of data.serverlessCosts ?? []) {
    const t = Number(c.promptTokens ?? 0) + Number(c.completionTokens ?? 0);
    tokens += t;
    nano += c.costNanoUsd ?? 0;
    const m = (c.modelName ?? "?").split("/").pop()!;
    porModelo[m] = (porModelo[m] ?? 0) + t;
  }
  return { tokens, usd: nano / 1e9, porModelo };
}

// Una alerta con la misma clave no se repite antes de esto: un Fireworks caído no debe
// mandar un correo por cada mensaje de cada usuario.
export const SILENCIO_MS = 6 * 60 * 60 * 1000;
export const debeAvisar = (ultima: number | undefined, ahora: number) =>
  ultima === undefined || ahora - ultima >= SILENCIO_MS;
