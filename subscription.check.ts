// Check de los helpers puros de suscripción. Correr: npx tsx subscription.check.ts
import assert from "node:assert";
import {
  parseStartToken, nextStatus, subscriptionAllows, newLinkToken, parseReveniuWebhook, eventoDesdeEstado, esAltaPromos, esBajaPromos,
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

// Consentimiento explícito (Ley 21.719): qué cuenta como "sí" y qué no.
import { esConsentimiento } from "./convex/subscription.ts";
for (const si of ["acepto", "Acepto", "/acepto", "  acepto  ", "acepto, gracias", "ACEPTO"]) {
  assert.strictEqual(esConsentimiento(si), true, `debería valer: ${si}`);
}
for (const no of ["ok", "sí", "si", "dale", "👍", "ya", "bueno", "no acepto", "aceptó algo"]) {
  assert.strictEqual(esConsentimiento(no), false, `NO debería valer: ${no}`);
}
console.log("consentimiento OK");

// Webhook de Reveniu: el formato de su doc y los que puede mandar producción.
const esperado = { event: "subscription_activated", subscriptionId: 313248, externalId: "k17", cancelReason: undefined, feedback: undefined };
assert.deepStrictEqual(parseReveniuWebhook(JSON.stringify({ event: "subscription_activated", data: { subscription_id: 313248, subscription_external_id: "k17" } })), esperado);
assert.deepStrictEqual(parseReveniuWebhook(JSON.stringify({ event: "subscription_activated", data: JSON.stringify({ subscription_id: "313248", subscription_external_id: "k17" }) })), esperado);
assert.deepStrictEqual(parseReveniuWebhook("event=subscription_activated&data=" + encodeURIComponent(JSON.stringify({ subscription_id: 313248, subscription_external_id: "k17" }))), esperado);
assert.deepStrictEqual(parseReveniuWebhook("event=subscription_activated&data%5Bsubscription_id%5D=313248&data%5Bsubscription_external_id%5D=k17"), esperado);
assert.deepStrictEqual(parseReveniuWebhook("event=subscription_activated&subscription_id=313248&subscription_external_id=k17"), esperado);
assert.strictEqual(parseReveniuWebhook(JSON.stringify({ event: "x", data: { subscription_external_id: null } })), null);
assert.strictEqual(parseReveniuWebhook(""), null);
assert.strictEqual(parseReveniuWebhook("basura{"), null);
assert.strictEqual(parseReveniuWebhook(JSON.stringify({ event: "subscription_activated", data: { subscription_id: 1, subscription_external_id: null } }))!.externalId, undefined);
assert.strictEqual(eventoDesdeEstado({ status: "1" }), "subscription_payment_succeeded");
assert.strictEqual(eventoDesdeEstado({ status: "6", payment_method: { last_4_card_digits: "XXXX0930" } }), "subscription_activated");
assert.strictEqual(eventoDesdeEstado({ status: "6", payment_method: { last_4_card_digits: null } }), null);
assert.strictEqual(eventoDesdeEstado({ status: "9" }), null);
console.log("webhook Reveniu OK");

// Promociones: alta solo por el id del botón; baja solo con "BAJA" como mensaje completo.
assert.strictEqual(esAltaPromos("promos"), true);
for (const no of ["sí", "si quiero", "quiero novedades", "Promos!", "ok"]) assert.strictEqual(esAltaPromos(no), false, no);
for (const si of ["BAJA", "baja", " Baja ", "baja.", "BAJA!"]) assert.strictEqual(esBajaPromos(si), true, si);
for (const no of ["estoy de baja", "baja de ánimo", "bajar", "dar de baja la suscripción"]) assert.strictEqual(esBajaPromos(no), false, no);
console.log("promos OK");
