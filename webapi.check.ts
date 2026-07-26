// Check del mapa de acciones sobre la suscripción (camino de dinero: lo que pasa este
// filtro termina en un PUT a MercadoPago). Correr: npx tsx webapi.check.ts
import assert from "node:assert";
import { ACTIONS } from "./convex/webapi.ts";

for (const [action, mp] of [["pause", "paused"], ["reactivate", "authorized"], ["cancel", "cancelled"]]) {
  assert.strictEqual(ACTIONS.get(action)?.mp, mp);
}

// Claves heredadas de Object.prototype: con un objeto literal el lookup devolvería una
// función (truthy) y la acción fabricada pasaría el guard. El Map las rechaza.
for (const bogus of ["bogus", "", "toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"]) {
  assert.strictEqual(ACTIONS.get(bogus), undefined, `debió rechazar "${bogus}"`);
}

console.log("webapi.check.ts OK");
