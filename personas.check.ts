// Check de buildSystemPrompt (puro). Correr: npx tsx personas.check.ts
import assert from "node:assert";
import { buildSystemPrompt, FALLBACK_SYSTEM, DEFAULT_ORACLE } from "./convex/personas.ts";

// Sin carta: devuelve el system tal cual.
assert.strictEqual(buildSystemPrompt("SOY LUNA", undefined), "SOY LUNA");

// Con carta parcial (solo sol/luna): agrega la línea de carta.
const p1 = buildSystemPrompt("BASE", { astro: { sun: "Aries", moon: "Tauro" }, birthTime: null });
assert.match(p1, /^BASE/);
assert.match(p1, /Carta del consultante: Sol en Aries, Luna en Tauro\./);

// Con ascendente incluido.
const p2 = buildSystemPrompt("BASE", { astro: { sun: "Aries", moon: "Tauro", asc: "Leo" }, birthTime: "14:30" });
assert.match(p2, /Sol en Aries, Luna en Tauro, Ascendente Leo\./);

// Le dice qué datos ya tiene, para que no los pida, sin revelar cuáles son.
assert.match(p1, /no sabe su hora/i);
assert.match(p2, /nunca se los pidas/);
assert.doesNotMatch(p2, /14:30/);
const p3 = buildSystemPrompt("BASE", { astro: { sun: "Aries", moon: "Tauro" }, birthTime: "14:30" });
assert.match(p3, /ciudad no permitió calcular el ascendente/);

// Carta vacía: no agrega línea.
assert.strictEqual(buildSystemPrompt("BASE", { astro: {} }), "BASE");

// Constantes exportadas.
assert.strictEqual(DEFAULT_ORACLE, "luna");
assert.ok(FALLBACK_SYSTEM.length > 0);

console.log("personas.check.ts OK");
