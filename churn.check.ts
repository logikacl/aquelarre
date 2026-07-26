// Check del cálculo puro de churn. Correr: npx tsx churn.check.ts
import assert from "node:assert";
import { churnMensual, type SubEvent } from "./convex/churn.ts";

const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
const ev = (email: string, status: string, iso: string): SubEvent => ({ email, status, at: at(iso) });

// Lista vacía.
assert.deepStrictEqual(churnMensual([]), []);

// Alta simple.
assert.deepStrictEqual(churnMensual([ev("a@x.cl", "active", "2026-01-10")]), [
  { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
]);

// Alta y baja en el mismo mes: churnPct usa activasInicio (0) → 0, no NaN ni Infinity.
const mismoMes = churnMensual([ev("a@x.cl", "active", "2026-01-05"), ev("a@x.cl", "cancelled", "2026-01-20")]);
assert.deepStrictEqual(mismoMes, [
  { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 1, activasFin: 0, churnPct: 0 },
]);

// Alta un mes, baja al siguiente → 100% de churn en febrero.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "active", "2026-01-05"), ev("a@x.cl", "paused", "2026-02-03")]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 1, activasFin: 0, churnPct: 100 },
  ],
);

// Mes sin movimiento en el medio: aparece igual, arrastrando saldos.
const conHueco = churnMensual([
  ev("a@x.cl", "active", "2026-01-05"),
  ev("b@x.cl", "active", "2026-01-06"),
  ev("c@x.cl", "active", "2026-01-07"),
  ev("a@x.cl", "cancelled", "2026-03-10"),
]);
assert.deepStrictEqual(conHueco, [
  { mes: "2026-01", activasInicio: 0, nuevas: 3, bajas: 0, activasFin: 3, churnPct: 0 },
  { mes: "2026-02", activasInicio: 3, nuevas: 0, bajas: 0, activasFin: 3, churnPct: 0 },
  // 1/3 → 33.3 (un decimal)
  { mes: "2026-03", activasInicio: 3, nuevas: 0, bajas: 1, activasFin: 2, churnPct: 33.3 },
]);

// Re-alta: dos "active" seguidos no cuentan doble; tras una baja sí es alta nueva.
// Y un "cancelled" sobre alguien ya inactivo tampoco cuenta.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", "2026-01-05"),
    ev("a@x.cl", "active", "2026-01-06"),
    ev("a@x.cl", "cancelled", "2026-02-01"),
    ev("a@x.cl", "cancelled", "2026-02-02"),
    ev("a@x.cl", "active", "2026-02-20"),
  ]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 1, bajas: 1, activasFin: 1, churnPct: 100 },
  ],
);

// "pending" no mueve el saldo (re-checkout de alguien activo no es baja).
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "pending", "2026-01-01"), ev("a@x.cl", "active", "2026-01-02"), ev("a@x.cl", "pending", "2026-02-01")]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 0, activasFin: 1, churnPct: 0 },
  ],
);

// Entrada desordenada → mismo resultado que ordenada.
const desordenados = churnMensual([
  ev("a@x.cl", "cancelled", "2026-02-03"),
  ev("a@x.cl", "active", "2026-01-05"),
]);
assert.deepStrictEqual(desordenados, [
  { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
  { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 1, activasFin: 0, churnPct: 100 },
]);

// Cruce de año: diciembre → enero.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "active", "2026-12-20"), ev("a@x.cl", "deleted", "2027-01-15")]).map((r) => r.mes),
  ["2026-12", "2027-01"],
);

console.log("churn.check.ts OK");
