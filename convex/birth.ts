// Parsers de datos de nacimiento en español + signo solar.
// Funciones puras (sin dependencias, corren en el runtime V8 de Convex).
// Check ejecutable: birth.check.ts

const MESES: Record<string, number> = {
  enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4,
  mayo: 5, may: 5, junio: 6, jun: 6, julio: 7, jul: 7, agosto: 8, ago: 8,
  septiembre: 9, setiembre: 9, sept: 9, sep: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12,
};

export type Fecha = { y: number; m: number; d: number; raw: string };

function ok(y: number, m: number, d: number, raw: string): Fecha | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  return { y, m, d, raw };
}

// Acepta "15/03/1990", "15-3-1990", "15.03.1990" (chileno DD/MM/AAAA),
// ISO "1990-03-15", y "15 de marzo de 1990" / "15 mar 1990".
// Funciona aunque el mensaje traiga la ciudad alrededor.
export function parseFecha(text: string): Fecha | null {
  const t = text.toLowerCase();
  let m = t.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/); // ISO AAAA-MM-DD
  if (m) return ok(+m[1], +m[2], +m[3], m[0]);
  m = t.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4})/); // DD/MM/AAAA
  if (m) return ok(+m[3], +m[2], +m[1], m[0]);
  m = t.match(/(\d{1,2})\s*(?:de\s+)?([a-záéíóú]+)\.?\s*(?:de\s+)?(\d{4})/); // DD mes AAAA
  if (m && MESES[m[2]]) return ok(+m[3], MESES[m[2]], +m[1], m[0]);
  return null;
}

export type Hora = { hh: number; mm: number };

// "14:30", "14.30", "2:30 pm", "9am", "10 hrs".
export function parseHora(text: string): Hora | null {
  const t = text.toLowerCase();
  let m = t.match(/(\d{1,2})[:.](\d{2})/);
  let hh: number, mm: number;
  if (m) { hh = +m[1]; mm = +m[2]; }
  else {
    m = t.match(/(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|hrs?|h)\b/);
    if (!m) return null;
    hh = +m[1]; mm = 0;
  }
  if (/p\.?m/.test(t) && hh < 12) hh += 12;
  if (/a\.?m/.test(t) && hh === 12) hh = 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

export function fmtHora({ hh, mm }: Hora): string {
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Reconoce "no sé la hora" y variantes, para no pedirla en loop.
export function noSabeHora(text: string): boolean {
  return /\b(no|nel|ni idea|desconozco|no s[eé]|no la s[eé]|no lo s[eé])\b/.test(
    text.toLowerCase(),
  );
}

export function isoFecha({ y, m, d }: Fecha): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
