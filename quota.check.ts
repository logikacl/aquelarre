// Check de la cuota diaria. Correr: npx tsx quota.check.ts
import assert from "node:assert";
import { DAILY_LIMIT, chileDay, usedToday } from "./convex/quota.ts";

assert.strictEqual(DAILY_LIMIT, 10);

// Contador de otro día (o ausente) = 0 usadas: la cuota se renueva sola, sin cron.
assert.strictEqual(usedToday("2026-08-24", undefined, undefined), 0);
assert.strictEqual(usedToday("2026-08-24", "2026-08-23", 10), 0);
assert.strictEqual(usedToday("2026-08-24", "2026-08-24", 7), 7);

// El borde que motiva usar hora local: 23:00 en Santiago (invierno, UTC-4) = 03:00Z del día
// siguiente. Con día UTC la cuota se reiniciaría antes de la medianoche chilena.
assert.strictEqual(chileDay(Date.UTC(2026, 7, 25, 3)), "2026-08-24");
assert.strictEqual(chileDay(Date.UTC(2026, 7, 25, 4)), "2026-08-25");
// Verano chileno (UTC-3): mismo borde corrido una hora.
assert.strictEqual(chileDay(Date.UTC(2026, 0, 25, 2)), "2026-01-24");
assert.strictEqual(chileDay(Date.UTC(2026, 0, 25, 3)), "2026-01-25");

console.log("quota.check.ts ok");
