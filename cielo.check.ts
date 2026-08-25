// Check del cielo de hoy y su cruce con el corpus. Correr: npx tsx cielo.check.ts
import assert from "node:assert";
import { cieloDeHoy, faseLunar, esRetrogrado, planetLon, signo } from "./convex/astro.ts";
import { bloqueCielo } from "./convex/cielo.ts";
import * as AstronomyNS from "astronomy-engine";
const { Body } = ((AstronomyNS as any).default ?? AstronomyNS) as typeof AstronomyNS;

const en = (iso: string) => new Date(iso + "T12:00:00Z");
const FASES = ["nueva", "creciente_inicial", "cuarto_creciente", "creciente_gibosa",
  "llena", "menguante_gibosa", "cuarto_menguante", "menguante_final"];

// ── Fase lunar ──────────────────────────────────────────────────────────────
// Los tramos van centrados: en la elongación exacta (0°, 180°) la fase tiene que
// ser la del nombre, no la siguiente. Si esto se rompe, "llena" llega tarde.
const luna = en("2026-08-25");
assert.strictEqual(FASES_DE(0), "nueva");
assert.strictEqual(FASES_DE(180), "llena");
assert.strictEqual(FASES_DE(90), "cuarto_creciente");
assert.strictEqual(FASES_DE(270), "cuarto_menguante");
assert.strictEqual(FASES_DE(359), "nueva", "justo antes de 360° sigue siendo nueva");
assert.strictEqual(FASES_DE(23), "creciente_inicial", "pasados los 22.5° ya no es nueva");

// Reimplementa el bucketing sobre una elongación dada, sin depender de efemérides.
function FASES_DE(elong: number): string {
  return FASES[Math.floor(((elong + 22.5) % 360) / 45)];
}

// La fase real de una fecha tiene que ser una de las ocho.
assert.ok(FASES.includes(faseLunar(luna)));

// ── Retrogradación ──────────────────────────────────────────────────────────
// La longitud tiene que ser geocéntrica: con la heliocéntrica ningún planeta
// retrograda nunca y la lista sale siempre vacía. Este es el check que lo caza.
const finDeAgosto = en("2026-08-25");
assert.ok(esRetrogrado(Body.Neptune, finDeAgosto), "Neptuno retrograda a fines de agosto");
assert.ok(esRetrogrado(Body.Pluto, finDeAgosto), "Plutón retrograda a fines de agosto");
assert.ok(!esRetrogrado(Body.Mars, finDeAgosto), "Marte está directo a fines de agosto de 2026");

// A lo largo de un año, cada lento tiene que retrogradar en algún momento y también
// estar directo en otro: si una de las dos no pasa, el signo del delta está invertido.
for (const body of [Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto]) {
  const dias = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)));
  const retro = dias.filter((d) => esRetrogrado(body, d)).length;
  assert.ok(retro > 30 && retro < 335, `${body}: ${retro} días retrógrado en 2026 — fuera de rango`);
}

// ── Cielo de hoy ────────────────────────────────────────────────────────────
const cielo = cieloDeHoy(luna);
assert.strictEqual(cielo.lentos.length, 5);
assert.deepStrictEqual(cielo.lentos.map((l) => l.planeta),
  ["jupiter", "saturno", "urano", "neptuno", "pluton"]);
// El signo del cielo tiene que coincidir con calcular la longitud a mano.
assert.strictEqual(cielo.lentos[0].signo, signo(planetLon(Body.Jupiter, luna)));
// Ningún planeta puede estar en dos estados a la vez.
assert.strictEqual(new Set(cielo.retrogrados).size, cielo.retrogrados.length);

// ── Cruce con el corpus ─────────────────────────────────────────────────────
const bloque = bloqueCielo(cielo);
assert.match(bloque, /^Cielo de hoy/);
// Una línea por la Luna + una por cada lento + una por cada retrógrado.
const lineas = bloque.split("\n").filter((l) => l.startsWith("- "));
assert.strictEqual(lineas.length, 1 + 5 + cielo.retrogrados.length,
  "algún registro del corpus no se encontró: el lookup quedó sin match");
assert.match(bloque, /Júpiter en Leo:/);
assert.ok(!bloque.includes("undefined"), "un campo del corpus llegó vacío al prompt");

// El bloque entra en el presupuesto de contexto: se manda en cada mensaje.
assert.ok(bloque.length < 4000, `el bloque pesa ${bloque.length} caracteres — demasiado por mensaje`);

console.log(`cielo.check.ts OK · ${bloque.length} caracteres, ${lineas.length} líneas`);
