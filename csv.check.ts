// Check del serializador CSV. Correr: npx tsx csv.check.ts
import assert from "node:assert";
import { toCsv } from "./lib/csv.ts";

assert.strictEqual(toCsv([]), "");

assert.strictEqual(toCsv([{ a: "x", b: "y" }]), "a,b\r\nx,y");

// Coma → hay que citar.
assert.strictEqual(toCsv([{ a: "uno,dos" }]), 'a\r\n"uno,dos"');

// Comilla doble → citar y duplicar la comilla.
assert.strictEqual(toCsv([{ a: 'di "hola"' }]), 'a\r\n"di ""hola"""');

// Salto de línea dentro del valor → citar (queda multilínea, es válido).
assert.strictEqual(toCsv([{ a: "uno\ndos" }]), 'a\r\n"uno\ndos"');

// Números salen tal cual, sin comillas.
assert.strictEqual(toCsv([{ n: 42, p: 3.5 }]), "n,p\r\n42,3.5");

// Varias filas, separadas por CRLF.
assert.strictEqual(toCsv([{ a: "1" }, { a: "2" }]), "a\r\n1\r\n2");

console.log("csv.check.ts OK");
