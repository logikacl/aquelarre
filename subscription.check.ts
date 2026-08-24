// Check de los helpers puros de suscripción. Correr: npx tsx subscription.check.ts
import assert from "node:assert";
import {
  parseStartToken, nextStatus, subscriptionAllows, newLinkToken,
} from "./convex/subscription.ts";

assert.strictEqual(parseStartToken("/start abc123"), "abc123");
assert.strictEqual(parseStartToken("/start   tok_XY-9"), "tok_XY-9");
assert.strictEqual(parseStartToken("/start@MiBot abc123"), "abc123");
assert.strictEqual(parseStartToken("/start"), null);
assert.strictEqual(parseStartToken("hola"), null);

// Registrar la tarjeta abre el acceso, venga de donde venga.
assert.strictEqual(nextStatus("subscription_activated", "pending"), "active");
assert.strictEqual(nextStatus("subscription_activated", "cancelled"), "active");

// Un cobro exitoso confirma, pero NUNCA revive lo que el usuario ya dio de baja:
// el orden de llegada de los webhooks no está garantizado.
assert.strictEqual(nextStatus("subscription_payment_succeeded", "pending"), "active");
assert.strictEqual(nextStatus("subscription_payment_succeeded", "active"), "active");
assert.strictEqual(nextStatus("subscription_payment_succeeded", "ending"), null);
assert.strictEqual(nextStatus("subscription_payment_succeeded", "cancelled"), null);

assert.strictEqual(nextStatus("subscription_renewal_cancelled", "active"), "ending");
assert.strictEqual(nextStatus("subscription_deactivated", "ending"), "cancelled");
assert.strictEqual(nextStatus("subscription_deactivated", "active"), "cancelled");

// Reveniu pide explícitamente NO suspender durante la recuperación de un cobro fallido.
assert.strictEqual(nextStatus("subscription_payment_in_recovery", "active"), null);
// Un evento que no conocemos no puede mover el estado de nadie.
assert.strictEqual(nextStatus("evento_inventado", "active"), null);
assert.strictEqual(nextStatus("", "active"), null);

// El gate del chat: "ending" pagó hasta el fin del período y tiene derecho a usarlo.
assert.strictEqual(subscriptionAllows({ status: "active" }), true);
assert.strictEqual(subscriptionAllows({ status: "ending" }), true);
assert.strictEqual(subscriptionAllows({ status: "cancelled" }), false);
assert.strictEqual(subscriptionAllows({ status: "pending" }), false);
assert.strictEqual(subscriptionAllows(null), false);
assert.strictEqual(subscriptionAllows(undefined), false);

const t = newLinkToken();
assert.match(t, /^[A-Za-z0-9]{24}$/);
assert.notStrictEqual(newLinkToken(), newLinkToken());

console.log("subscription.check.ts OK");
