// Check del parser de nacimiento. Correr: npx tsx birth.check.ts
import assert from "node:assert";
import {
  parseFecha, parseHora, fmtHora, noSabeHora, isoFecha,
} from "./convex/birth.ts";

// Fechas numéricas (DD/MM/AAAA chileno) e ISO
assert.deepStrictEqual(parseFecha("15/03/1990")!.m, 3);
assert.deepStrictEqual(parseFecha("15-3-1990")!.d, 15);
assert.strictEqual(isoFecha(parseFecha("1.12.1985")!), "1985-12-01");
assert.strictEqual(isoFecha(parseFecha("1977-03-22")!), "1977-03-22"); // ISO

// Fechas con mes en palabra, aun con ciudad alrededor (bug del transcript)
assert.strictEqual(isoFecha(parseFecha("Santiago, 22 de marzo de 1977")!), "1977-03-22");
assert.strictEqual(isoFecha(parseFecha("nací en Santiago el 15 de marzo de 1990")!), "1990-03-15");
assert.strictEqual(parseFecha("3 setiembre 2001")!.m, 9);
assert.strictEqual(parseFecha("22 mar 1977")!.m, 3); // mes abreviado
assert.strictEqual(parseFecha("5 ene. 1980")!.m, 1); // abreviado con punto

// Fechas inválidas
assert.strictEqual(parseFecha("no me acuerdo"), null);
assert.strictEqual(parseFecha("32/13/1990"), null);

// Horas
assert.deepStrictEqual(parseHora("14:30"), { hh: 14, mm: 30 });
assert.strictEqual(fmtHora(parseHora("2:30 pm")!), "14:30");
assert.strictEqual(fmtHora(parseHora("9am")!), "09:00");
assert.strictEqual(fmtHora(parseHora("12am")!), "00:00");
assert.strictEqual(parseHora("no sé"), null);
assert.strictEqual(parseHora("25:00"), null);

// No sabe la hora
assert.strictEqual(noSabeHora("no sé"), true);
assert.strictEqual(noSabeHora("ni idea"), true);
assert.strictEqual(noSabeHora("a las 14:30"), false);

console.log("birth.check.ts OK");
