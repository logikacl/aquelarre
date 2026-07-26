// Check del cálculo puro de churn. Correr: npx tsx churn.check.ts
import assert from "node:assert";
import { churnMensual, type SubEvent } from "./convex/churn.ts";

// Los buckets son meses en hora de Santiago, así que los timestamps van en UTC explícito
// y los de borde llevan su hora local al lado. utc(2026, 1, 5) = 15:00Z = mediodía en
// Santiago, bien lejos de cualquier borde de mes.
const utc = (y: number, mes: number, d: number, h = 15) => Date.UTC(y, mes - 1, d, h);
const ev = (email: string, status: string, at: number): SubEvent => ({ email, status, at });

// Lista vacía.
assert.deepStrictEqual(churnMensual([]), []);

// Alta simple.
assert.deepStrictEqual(churnMensual([ev("a@x.cl", "active", utc(2026, 1, 10))]), [
  { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
]);

// Alta y baja en el mismo mes: churnPct usa activasInicio (0) → 0, no NaN ni Infinity.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "active", utc(2026, 1, 5)), ev("a@x.cl", "cancelled", utc(2026, 1, 20))]),
  [{ mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 1, activasFin: 0, churnPct: 0 }],
);

// El caso que motiva agrupar en hora local: baja el 31 de enero a las 23:00 en Santiago
// (verano chileno, UTC-3) = 2026-02-01T02:00Z. Con buckets UTC caería en febrero.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", utc(2026, 1, 5)),
    ev("a@x.cl", "cancelled", Date.UTC(2026, 1, 1, 2)), // 2026-01-31 23:00 en Santiago
  ]),
  [{ mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 1, activasFin: 0, churnPct: 0 }],
);

// Mismo borde en invierno chileno (UTC-4): 2026-08-01T03:00Z = 2026-07-31 23:00 en Santiago.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", utc(2026, 7, 5)),
    ev("a@x.cl", "cancelled", Date.UTC(2026, 7, 1, 3)), // 2026-07-31 23:00 en Santiago
  ]).map((r) => r.mes),
  ["2026-07"],
);

// Alta un mes, baja al siguiente → 100% de churn en febrero.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "active", utc(2026, 1, 5)), ev("a@x.cl", "paused", utc(2026, 2, 3))]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 1, activasFin: 0, churnPct: 100 },
  ],
);

// Mes sin movimiento en el medio: aparece igual, arrastrando saldos.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", utc(2026, 1, 5)),
    ev("b@x.cl", "active", utc(2026, 1, 6)),
    ev("c@x.cl", "active", utc(2026, 1, 7)),
    ev("a@x.cl", "cancelled", utc(2026, 3, 10)),
  ]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 3, bajas: 0, activasFin: 3, churnPct: 0 },
    { mes: "2026-02", activasInicio: 3, nuevas: 0, bajas: 0, activasFin: 3, churnPct: 0 },
    // 1/3 → 33.3 (un decimal)
    { mes: "2026-03", activasInicio: 3, nuevas: 0, bajas: 1, activasFin: 2, churnPct: 33.3 },
  ],
);

// Re-alta: dos "active" seguidos no cuentan doble; tras una baja sí es alta nueva.
// Y un "cancelled" sobre alguien ya inactivo tampoco cuenta.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", utc(2026, 1, 5)),
    ev("a@x.cl", "active", utc(2026, 1, 6)),
    ev("a@x.cl", "cancelled", utc(2026, 2, 1)),
    ev("a@x.cl", "cancelled", utc(2026, 2, 2)),
    ev("a@x.cl", "active", utc(2026, 2, 20)),
  ]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 1, bajas: 1, activasFin: 1, churnPct: 100 },
  ],
);

// "pending" no mueve el saldo (re-checkout de alguien activo no es baja).
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "pending", utc(2026, 1, 1)),
    ev("a@x.cl", "active", utc(2026, 1, 2)),
    ev("a@x.cl", "pending", utc(2026, 2, 1)),
  ]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 0, activasFin: 1, churnPct: 0 },
  ],
);

// Entrada desordenada → mismo resultado que ordenada.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "cancelled", utc(2026, 2, 3)), ev("a@x.cl", "active", utc(2026, 1, 5))]),
  [
    { mes: "2026-01", activasInicio: 0, nuevas: 1, bajas: 0, activasFin: 1, churnPct: 0 },
    { mes: "2026-02", activasInicio: 1, nuevas: 0, bajas: 1, activasFin: 0, churnPct: 100 },
  ],
);

// Cruce de año en el relleno de meses: diciembre → enero.
assert.deepStrictEqual(
  churnMensual([ev("a@x.cl", "active", utc(2026, 12, 20)), ev("a@x.cl", "deleted", utc(2027, 1, 15))]).map(
    (r) => r.mes,
  ),
  ["2026-12", "2027-01"],
);

// Y el borde de año en hora local: 2027-01-01T02:00Z = 2026-12-31 23:00 en Santiago → diciembre.
assert.deepStrictEqual(
  churnMensual([
    ev("a@x.cl", "active", utc(2026, 12, 20)),
    ev("a@x.cl", "deleted", Date.UTC(2027, 0, 1, 2)), // 2026-12-31 23:00 en Santiago
  ]).map((r) => r.mes),
  ["2026-12"],
);

console.log("churn.check.ts OK");
