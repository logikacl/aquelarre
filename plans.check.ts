// Check de las reglas de planes. Correr: npx tsx plans.check.ts
import assert from "node:assert";
import { validarPlan, planPorDefecto, elegirPlan, bulletsVisibles, MONTO_MIN, MONTO_MAX } from "./convex/planRules.ts";

const base = { slug: "silente", name: "Silente", priceClp: 6000, dailyLimit: 25, bullets: ["a"], published: true, order: 0 };
assert.strictEqual(validarPlan(base), null);
assert.match(validarPlan({ ...base, slug: "Con Espacio" })!, /slug/);
assert.match(validarPlan({ ...base, priceClp: MONTO_MIN - 1 })!, /precio/);
assert.match(validarPlan({ ...base, priceClp: MONTO_MAX + 1 })!, /precio/);
assert.match(validarPlan({ ...base, priceClp: 1500.5 })!, /precio/);
assert.match(validarPlan({ ...base, dailyLimit: 0 })!, /mensajes/);
assert.match(validarPlan({ ...base, name: "  " })!, /nombre/);

// Fallback: tabla vacía = el plan de siempre, con el precio de settings y la cuota histórica.
const d = planPorDefecto(3000, 13336);
assert.deepStrictEqual([d.slug, d.priceClp, d.dailyLimit, d.reveniuPlanId], ["silente", 3000, 10, 13336]);

const p2 = { ...base, slug: "premium", order: 1 };
const oculto = { ...base, slug: "viejo", published: false, order: -1 };
assert.strictEqual(elegirPlan([oculto, base, p2], "premium")?.slug, "premium");
assert.strictEqual(elegirPlan([oculto, base, p2], undefined)?.slug, "silente"); // primer publicado
assert.strictEqual(elegirPlan([oculto, base, p2], "viejo")?.slug, "silente"); // oculto no se vende
assert.strictEqual(elegirPlan([oculto], undefined), null);

// La cuota siempre encabeza los beneficios: no puede quedar un texto que la contradiga.
assert.deepStrictEqual(bulletsVisibles(base), ["25 mensajes al día por WhatsApp", "a"]);

console.log("plans.check.ts ok");
