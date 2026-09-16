// Check de hash/verify de password (PBKDF2 Web Crypto). Correr: npx tsx password.check.ts
import assert from "node:assert";
import { hashPassword, verifyPassword } from "./convex/password.ts";

const h = await hashPassword("correcta-horse");
assert.match(h, /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/); // salt:hash en base64
assert.strictEqual(await verifyPassword("correcta-horse", h), true);
assert.strictEqual(await verifyPassword("otra", h), false);
// dos hashes del mismo password difieren (salt aleatorio)
assert.notStrictEqual(await hashPassword("x"), await hashPassword("x"));

// Reglas de contraseña (las que aplica el registro).
import { passwordValida, reglasPassword } from "./convex/passwordRules.ts";
const mail = "camila.rojas@gmail.com";
for (const buena of ["Andromeda2026", "LunaLlena9en", "ÑandúDelSur77", "correct Horse 9 battery"]) {
  assert.strictEqual(passwordValida(buena, mail), true, `debería valer: ${buena}`);
}
for (const [mala, porque] of [
  ["Corta1a", "menos de 10"],
  ["todominuscula1", "sin mayúscula"],
  ["TODOMAYUSCULA1", "sin minúscula"],
  ["SinNumerosAqui", "sin número"],
  ["Camila.Rojas2026", "contiene el usuario del correo"],
  ["A1" + "a".repeat(127), "más de 128"],
  ["", "vacía"],
] as const) {
  assert.strictEqual(passwordValida(mala, mail), false, `NO debería valer (${porque}): ${mala.slice(0, 20)}`);
}
// La ñ/á cuentan como minúscula; sin esto, "ÑANDÚ" + números pasaría por tener minúscula.
assert.strictEqual(reglasPassword("ÑANDÚÑANDÚ12")[1].ok, false);
assert.strictEqual(reglasPassword("ñandúÑANDÚ12")[1].ok, true);
// Usuario de menos de 4 letras no se chequea: "ana" aparece por azar en "Banana".
assert.strictEqual(passwordValida("Bananas2026x", "ana@x.cl"), true);

console.log("password.check.ts OK");
