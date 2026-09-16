// Check del número de WhatsApp: lo que la persona escribe → wa_id. Correr: npx tsx telefono.check.ts
import assert from "node:assert";
import { normalizarTelefono, formatearTelefono } from "./convex/telefono.ts";

const WA = 56978644790; // el wa_id que manda WhatsApp para +56 9 7864 4790
for (const escrito of ["9 7864 4790", "978644790", "+56 9 7864 4790", "56978644790", "+56978644790", "(+56) 9-7864-4790"]) {
  assert.strictEqual(normalizarTelefono(escrito), WA, `debería dar ${WA}: "${escrito}"`);
}

// Otro país, solo con "+" explícito.
assert.strictEqual(normalizarTelefono("+34 612 345 678"), 34612345678);
assert.strictEqual(normalizarTelefono("34 612 345 678"), null, "sin + no se adivina el país");

for (const [malo, porque] of [
  ["", "vacío"],
  ["7864 4790", "8 dígitos, falta el 9"],
  ["878644790", "9 dígitos que no empiezan con 9: no es celular"],
  ["+56 2 2123 4567", "fijo chileno"],
  ["+56 9 7864 479", "celular chileno incompleto"],
  ["hola", "sin dígitos"],
  ["+0 123 456 789", "no hay código de país que empiece con 0"],
] as const) {
  assert.strictEqual(normalizarTelefono(malo), null, `NO debería valer (${porque}): "${malo}"`);
}

assert.strictEqual(formatearTelefono(WA), "+56 9 7864 4790");
assert.strictEqual(formatearTelefono(34612345678), "+34612345678");
// ida y vuelta: lo que mostramos se puede volver a escribir y da el mismo número
assert.strictEqual(normalizarTelefono(formatearTelefono(WA)), WA);

console.log("telefono.check.ts OK");
