// Reglas puras del monitoreo de costos y capacidad (sin Convex) → testeables con monitor.check.ts.

export type Fireworks = {
  tokens: number; // últimas 24 h
  usd: number; // últimas 24 h, calculado con el precio (ver costoFireworks)
  porModelo: Record<string, number>;
  promedioDia: number; // US$/día, días con consumo de los últimos 7
  picoDia: number; // US$ del peor día de los últimos 7
  proyeccion30: number; // promedioDia × 30
  stock: number; // saldo mínimo: DIAS_STOCK × picoDia
  saldo: number | null; // estimado: último saldo registrado − consumo desde entonces
  saldoAl: string | null; // cuándo se registró
  diasCobertura: number | null; // saldo / picoDia
  falta: number; // US$ que faltan para llegar al stock
};

export type Lectura = {
  fireworks: Fireworks | { error: string };
  whatsapp: { quality: string; status: string; limite: string } | { error: string };
  web: { status: number; ms: number } | { error: string };
  convex: { conversaciones: number; mensajes: number };
};

export type Umbrales = { tokensDia: number; mensajes: number };

// Días de consumo que el saldo prepago de Fireworks debe cubrir siempre (decisión de Ignacio,
// 2026-11-25). Se mide contra el peor día de la semana, no el promedio: así un día alto no
// deja el stock corto.
export const DIAS_STOCK = 3;

// Cada string devuelto es un problema que merece alerta. Lista vacía = todo en orden.
export function evaluar(l: Lectura, u: Umbrales): string[] {
  const p: string[] = [];
  const f = l.fireworks;
  if ("error" in f) p.push(`Fireworks: no se pudo leer el consumo (${f.error})`);
  else {
    if (f.saldo === null) p.push("Fireworks: saldo no registrado (díselo a Hermi tras cada carga)");
    else if (f.falta > 0)
      p.push(
        `Fireworks: saldo ~US$${f.saldo.toFixed(2)} cubre ${f.diasCobertura?.toFixed(1)} días (< ${DIAS_STOCK}); ` +
          `cargar al menos US$${f.falta.toFixed(2)}`,
      );
    if (f.tokens > u.tokensDia) p.push(`Fireworks: ${f.tokens} tokens en 24 h > ${u.tokensDia}`);
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

// US$ por millón de tokens: entrada sin caché, entrada en caché, salida.
export type Precio = { in: number; cached: number; out: number };
// Precio público de deepseek-v4p1-flash en Fireworks (fireworks.ai/pricing, 2026-11-25).
// Se calcula acá porque billingUsage devuelve costNanoUsd = 0. Se cambia con la env
// FIREWORKS_PRECIO="entrada,caché,salida".
export const PRECIO_DEFAULT: Precio = { in: 0.3, cached: 0.006, out: 1.2 };
export const parsePrecio = (s?: string): Precio => {
  const [i, c, o] = (s ?? "").split(",").map(Number);
  return [i, c, o].every((x) => Number.isFinite(x) && x >= 0) ? { in: i, cached: c, out: o } : PRECIO_DEFAULT;
};

type Bucket = {
  modelName?: string;
  startTime?: string;
  promptTokens?: string;
  uncachedPromptTokens?: string;
  cachedPromptTokens?: string;
  completionTokens?: string;
};

// Suma la respuesta de GET /v1/accounts/{id}/billingUsage. Los tokens llegan como string.
// ponytail: un solo precio para todos los modelos; si se usan varios en serio, precio por modelo.
export function costoFireworks(data: { serverlessCosts?: Bucket[] }, precio: Precio) {
  let tokens = 0;
  let usd = 0;
  const porModelo: Record<string, number> = {};
  const porDia: Record<string, number> = {};
  for (const c of data.serverlessCosts ?? []) {
    const cached = Number(c.cachedPromptTokens ?? 0);
    const uncached =
      c.uncachedPromptTokens !== undefined ? Number(c.uncachedPromptTokens) : Number(c.promptTokens ?? 0) - cached;
    const out = Number(c.completionTokens ?? 0);
    const costo = (uncached * precio.in + cached * precio.cached + out * precio.out) / 1e6;
    const t = uncached + cached + out;
    tokens += t;
    usd += costo;
    const m = (c.modelName ?? "?").split("/").pop()!;
    porModelo[m] = (porModelo[m] ?? 0) + t;
    const d = (c.startTime ?? "").slice(0, 10);
    porDia[d] = (porDia[d] ?? 0) + costo;
  }
  return { tokens, usd, porModelo, porDia };
}

// Proyección y stock con el consumo diario de la última semana y el saldo estimado.
export function proyectar(porDia: Record<string, number>, saldo: number | null) {
  const dias = Object.values(porDia);
  const promedioDia = dias.length ? dias.reduce((a, b) => a + b, 0) / dias.length : 0;
  const picoDia = Math.max(0, ...dias);
  const stock = DIAS_STOCK * picoDia;
  return {
    promedioDia,
    picoDia,
    proyeccion30: promedioDia * 30,
    stock,
    diasCobertura: saldo === null ? null : picoDia > 0 ? saldo / picoDia : Infinity,
    falta: saldo === null ? 0 : Math.max(0, stock - saldo),
  };
}

// Una alerta con la misma clave no se repite antes de esto: un Fireworks caído no debe
// mandar un correo por cada mensaje de cada usuario.
export const SILENCIO_MS = 6 * 60 * 60 * 1000;
export const debeAvisar = (ultima: number | undefined, ahora: number) =>
  ultima === undefined || ahora - ultima >= SILENCIO_MS;
