// Check de buildSystemPrompt (puro). Correr: npx tsx personas.check.ts
import assert from "node:assert";
import { buildSystemPrompt, FALLBACK_SYSTEM, DEFAULT_ORACLE } from "./convex/personas.ts";

// Sin carta: devuelve el system tal cual.
assert.strictEqual(buildSystemPrompt("SOY LUNA", undefined), "SOY LUNA");

// Con carta parcial (solo sol/luna): agrega la línea de carta.
const p1 = buildSystemPrompt("BASE", { sun: "Aries", moon: "Tauro" });
assert.match(p1, /^BASE/);
assert.match(p1, /Carta del consultante: Sol en Aries, Luna en Tauro\./);

// Con ascendente incluido.
const p2 = buildSystemPrompt("BASE", { sun: "Aries", moon: "Tauro", asc: "Leo" });
assert.match(p2, /Sol en Aries, Luna en Tauro, Ascendente Leo\./);

// Carta vacía: no agrega línea.
assert.strictEqual(buildSystemPrompt("BASE", {}), "BASE");

// Constantes exportadas.
assert.strictEqual(DEFAULT_ORACLE, "luna");
assert.ok(FALLBACK_SYSTEM.length > 0);

console.log("personas.check.ts OK");
