// Check del monitoreo de costos. Correr: npx tsx monitor.check.ts
import assert from "node:assert";
import { evaluar, sumarFireworks, debeAvisar, SILENCIO_MS } from "./convex/monitorRules.ts";

const s = sumarFireworks({
  serverlessCosts: [
    { modelName: "accounts/fireworks/models/a", promptTokens: "100", completionTokens: "50", costNanoUsd: 2e9 },
    { modelName: "accounts/fireworks/models/a", promptTokens: "10", completionTokens: "0", costNanoUsd: 0 },
    { modelName: "accounts/fireworks/models/b", promptTokens: "1", completionTokens: "1" },
  ],
});
assert.deepStrictEqual(s, { tokens: 162, usd: 2, porModelo: { a: 160, b: 2 } });
assert.deepStrictEqual(sumarFireworks({}), { tokens: 0, usd: 0, porModelo: {} });

const u = { usdDia: 3, tokensDia: 1000, mensajes: 100 };
const sano = {
  fireworks: { tokens: 10, usd: 0.1, porModelo: {} },
  whatsapp: { quality: "GREEN", status: "CONNECTED", limite: "TIER_250" },
  web: { status: 200, ms: 300 },
  convex: { conversaciones: 1, mensajes: 5 },
};
assert.deepStrictEqual(evaluar(sano, u), []);
assert.strictEqual(evaluar({ ...sano, fireworks: { tokens: 10, usd: 5, porModelo: {} } }, u).length, 1);
assert.strictEqual(evaluar({ ...sano, fireworks: { tokens: 5000, usd: 0, porModelo: {} } }, u).length, 1);
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
