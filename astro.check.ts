// Valida la carta contra un caso publicado. Correr: npx tsx astro.check.ts
import assert from "node:assert";
import { signo, sunLon, moonLon, ascendant } from "./convex/astro.ts";

// Einstein: 1879-03-14 11:30 LMT Ulm (9.98°E) → ~10:50 UTC. lat 48.40, lon 9.98°E.
// Astro-databank: Sol Piscis, Luna Sagitario, Ascendente Cáncer.
const einstein = new Date(Date.UTC(1879, 2, 14, 10, 50));
console.log("Einstein  sol=%s luna=%s asc=%s",
  signo(sunLon(einstein)), signo(moonLon(einstein)),
  signo(ascendant(einstein, 48.4, 9.98)));
assert.strictEqual(signo(sunLon(einstein)), "Piscis");
assert.strictEqual(signo(moonLon(einstein)), "Sagitario");
assert.strictEqual(signo(ascendant(einstein, 48.4, 9.98)), "Cáncer");

// signo() en bordes de 30°
assert.strictEqual(signo(0), "Aries");
assert.strictEqual(signo(29.9), "Aries");
assert.strictEqual(signo(30), "Tauro");
assert.strictEqual(signo(-1), "Piscis");
assert.strictEqual(signo(359.9), "Piscis");

console.log("astro.check.ts OK");
