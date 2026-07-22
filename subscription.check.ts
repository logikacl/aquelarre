// Check de los helpers puros de suscripción. Correr: npx tsx subscription.check.ts
import assert from "node:assert";
import {
  parseStartToken, mapPreapprovalStatus, subscriptionAllows, newLinkToken,
} from "./convex/subscription.ts";

assert.strictEqual(parseStartToken("/start abc123"), "abc123");
assert.strictEqual(parseStartToken("/start   tok_XY-9"), "tok_XY-9");
assert.strictEqual(parseStartToken("/start@MiBot abc123"), "abc123");
assert.strictEqual(parseStartToken("/start"), null);
assert.strictEqual(parseStartToken("hola"), null);

assert.strictEqual(mapPreapprovalStatus("authorized"), "active");
assert.strictEqual(mapPreapprovalStatus("paused"), "paused");
assert.strictEqual(mapPreapprovalStatus("cancelled"), "cancelled");
assert.strictEqual(mapPreapprovalStatus("pending"), "pending");

assert.strictEqual(subscriptionAllows({ status: "active" }), true);
assert.strictEqual(subscriptionAllows({ status: "paused" }), false);
assert.strictEqual(subscriptionAllows({ status: "cancelled" }), false);
assert.strictEqual(subscriptionAllows({ status: "pending" }), false);
assert.strictEqual(subscriptionAllows(null), false);
assert.strictEqual(subscriptionAllows(undefined), false);

const t = newLinkToken();
assert.match(t, /^[A-Za-z0-9]{24}$/);
assert.notStrictEqual(newLinkToken(), newLinkToken());

console.log("subscription.check.ts OK");
