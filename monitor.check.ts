// Check del monitoreo de costos. Correr: npx tsx monitor.check.ts
import assert from "node:assert";
import {
  evaluar, costoFireworks, proyectar, parsePrecio, PRECIO_DEFAULT, debeAvisar, SILENCIO_MS, DIAS_STOCK,
  type Fireworks,
} from "./convex/monitorRules.ts";

const cerca = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

// Costo: 1M sin caché a 0,30 + 1M en caché a 0,006 + 1M de salida a 1,20, repartido en dos días.
const c = costoFireworks(
  {
    serverlessCosts: [
      { modelName: "accounts/fireworks/models/a", startTime: "2026-11-24T00:00:00Z", uncachedPromptTokens: "1000000", cachedPromptTokens: "1000000", completionTokens: "0" },
      { modelName: "accounts/fireworks/models/a", startTime: "2026-11-25T00:00:00Z", promptTokens: "0", completionTokens: "1000000" },
    ],
  },
  PRECIO_DEFAULT,
);
assert.strictEqual(c.tokens, 3_000_000);
cerca(c.usd, 1.506);
cerca(c.porDia["2026-11-24"], 0.306);
cerca(c.porDia["2026-11-25"], 1.2);
assert.deepStrictEqual(c.porModelo, { a: 3_000_000 });
// Sin uncachedPromptTokens se deduce de promptTokens − cached.
cerca(costoFireworks({ serverlessCosts: [{ promptTokens: "1000000", cachedPromptTokens: "400000" }] }, PRECIO_DEFAULT).usd, 0.18 + 0.0024);

assert.deepStrictEqual(parsePrecio("0.5,0.01,2"), { in: 0.5, cached: 0.01, out: 2 });
assert.deepStrictEqual(parsePrecio("basura"), PRECIO_DEFAULT);
assert.deepStrictEqual(parsePrecio(undefined), PRECIO_DEFAULT);

// Proyección: el stock se mide contra el peor día, no el promedio.
const p = proyectar({ a: 1, b: 3 }, 6);
assert.strictEqual(p.promedioDia, 2);
assert.strictEqual(p.picoDia, 3);
assert.strictEqual(p.proyeccion30, 60);
assert.strictEqual(p.stock, DIAS_STOCK * 3);
assert.strictEqual(p.diasCobertura, 2);
assert.strictEqual(p.falta, DIAS_STOCK * 3 - 6);
assert.strictEqual(proyectar({ a: 1 }, 100).falta, 0);
assert.strictEqual(proyectar({}, 5).diasCobertura, Infinity); // sin consumo, el saldo no se acaba
assert.strictEqual(proyectar({ a: 1 }, null).diasCobertura, null);

const fw: Fireworks = {
  tokens: 10, usd: 0.1, porModelo: {}, promedioDia: 1, picoDia: 1, proyeccion30: 30, stock: 3,
  saldo: 10, saldoAl: "x", diasCobertura: 10, falta: 0,
};
const u = { tokensDia: 1000, mensajes: 100 };
const sano = {
  fireworks: fw,
  whatsapp: { quality: "GREEN", status: "CONNECTED", limite: "TIER_250" },
  web: { status: 200, ms: 300 },
  convex: { conversaciones: 1, mensajes: 5 },
};
assert.deepStrictEqual(evaluar(sano, u), []);
assert.match(evaluar({ ...sano, fireworks: { ...fw, saldo: 2, diasCobertura: 2, falta: 1 } }, u)[0], /cubre 2\.0 días.*US\$1\.00/);
assert.match(evaluar({ ...sano, fireworks: { ...fw, saldo: null, diasCobertura: null } }, u)[0], /no registrado/);
assert.match(evaluar({ ...sano, fireworks: { ...fw, tokens: 5000 } }, u)[0], /tokens/);
assert.match(evaluar({ ...sano, fireworks: { error: "x" } }, u)[0], /Fireworks/);
assert.match(evaluar({ ...sano, whatsapp: { ...sano.whatsapp, quality: "YELLOW" } }, u)[0], /calidad/);
assert.deepStrictEqual(evaluar({ ...sano, whatsapp: { ...sano.whatsapp, quality: "UNKNOWN" } }, u), []);
assert.match(evaluar({ ...sano, whatsapp: { ...sano.whatsapp, status: "FLAGGED" } }, u)[0], /FLAGGED/);
assert.match(evaluar({ ...sano, web: { status: 402, ms: 1 } }, u)[0], /402/);
assert.match(evaluar({ ...sano, web: { error: "timeout" } }, u)[0], /no responde/);
assert.match(evaluar({ ...sano, convex: { conversaciones: 1, mensajes: 101 } }, u)[0], /Convex/);

assert.strictEqual(debeAvisar(undefined, 0), true);
assert.strictEqual(debeAvisar(0, SILENCIO_MS - 1), false);
assert.strictEqual(debeAvisar(0, SILENCIO_MS), true);

console.log("monitor.check.ts OK");
