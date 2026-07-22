// Carta natal con astronomy-engine (JS puro, corre en el runtime V8 de Convex).
// Sin API externa: todo el cálculo es local → sin transferencia internacional.
// Check ejecutable: astro.check.ts
// Interop: Convex (esbuild) ve named exports; Node/tsx lo trata como CJS bajo .default.
import * as AstronomyNS from "astronomy-engine";
const { SunPosition, EclipticGeoMoon, SiderealTime, MakeTime } =
  ((AstronomyNS as any).default ?? AstronomyNS) as typeof AstronomyNS;

const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

export function signo(lonEclip: number): string {
  return SIGNOS[Math.floor(norm360(lonEclip) / 30)];
}

// Longitud eclíptica geocéntrica de fecha (grados).
export function sunLon(date: Date): number {
  return SunPosition(date).elon;
}
export function moonLon(date: Date): number {
  return EclipticGeoMoon(date).lon;
}

// Oblicuidad media de la eclíptica (grados), IAU 1980.
function obliquity(date: Date): number {
  const t = MakeTime(date).tt / 36525; // siglos julianos TT desde J2000
  return 23.439291 - 0.0130042 * t - 1.64e-7 * t * t + 5.04e-7 * t * t * t;
}

// Ascendente: signo del punto eclíptico que sube por el horizonte este.
// lonEast = longitud geográfica (este positivo; Chile es negativa).
export function ascendant(date: Date, latDeg: number, lonEast: number): number {
  const gast = SiderealTime(date); // horas siderales de Greenwich
  const ramc = d2r(norm360(gast * 15 + lonEast)); // tiempo sideral local (RAMC)
  const eps = d2r(obliquity(date));
  const lat = d2r(latDeg);
  const asc = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)),
  );
  return norm360(r2d(asc));
}

// Convierte hora de pared local (Chile) al instante UTC, con DST histórico
// vía la base IANA de ICU (Intl) — sin dependencias.
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const { type, value } of dtf.formatToParts(instant)) p[type] = value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - instant.getTime();
}

export function zonedToUtc(dateIso: string, hhmm: string, tz = "America/Santiago"): Date {
  const [y, mo, d] = dateIso.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // dos pasadas cubren los saltos de DST
  const off = tzOffsetMs(new Date(guess - tzOffsetMs(new Date(guess), tz)), tz);
  return new Date(guess - off);
}

export type Carta = { sun: string; moon: string; asc?: string };

// dateIso + hora local Chile → carta. Sin hora usamos mediodía (basta para sol/luna).
// El ascendente solo se calcula con hora exacta + coordenadas.
export function natalChart(
  dateIso: string,
  timeHHMM: string | null,
  coords: { lat: number; lon: number } | null,
): Carta {
  const utc = zonedToUtc(dateIso, timeHHMM ?? "12:00");
  const carta: Carta = { sun: signo(sunLon(utc)), moon: signo(moonLon(utc)) };
  if (timeHHMM && coords) carta.asc = signo(ascendant(utc, coords.lat, coords.lon));
  return carta;
}
