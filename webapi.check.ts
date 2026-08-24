// Check del mapa de acciones sobre la suscripción (camino de dinero: lo que pasa este
// filtro termina en una llamada a Reveniu). Correr: npx tsx webapi.check.ts
import assert from "node:assert";
import { ACTIONS, yaTieneSuscripcion } from "./convex/webapi.ts";

for (const [action, op, estado] of [
  ["no_renovar", "disablerenew", "ending"],
  ["cancel", "disable", "cancelled"],
] as const) {
  assert.strictEqual(ACTIONS.get(action)?.op, op);
  assert.strictEqual(ACTIONS.get(action)?.internal, estado);
}

// "reactivate" ya no es una acción de API: desde cancelled el camino es un checkout nuevo.
assert.strictEqual(ACTIONS.get("reactivate"), undefined);

// Claves heredadas de Object.prototype: con un objeto literal el lookup devolvería una
// función (truthy) y la acción fabricada pasaría el guard. El Map las rechaza.
for (const bogus of ["bogus", "", "toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"]) {
  assert.strictEqual(ACTIONS.get(bogus), undefined, `debió rechazar "${bogus}"`);
}

// Guard de doble cobro: sin esto un re-checkout deja dos suscripciones vivas cobrando.
assert.strictEqual(yaTieneSuscripcion({ status: "active" }), true);
assert.strictEqual(yaTieneSuscripcion({ status: "ending" }), true);
assert.strictEqual(yaTieneSuscripcion({ status: "pending" }), false);
assert.strictEqual(yaTieneSuscripcion({ status: "cancelled" }), false);
assert.strictEqual(yaTieneSuscripcion(null), false);

console.log("webapi.check.ts OK");
