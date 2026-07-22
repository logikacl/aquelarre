// Check de hash/verify de password (PBKDF2 Web Crypto). Correr: npx tsx password.check.ts
import assert from "node:assert";
import { hashPassword, verifyPassword } from "./convex/password.ts";

const h = await hashPassword("correcta-horse");
assert.match(h, /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/); // salt:hash en base64
assert.strictEqual(await verifyPassword("correcta-horse", h), true);
assert.strictEqual(await verifyPassword("otra", h), false);
// dos hashes del mismo password difieren (salt aleatorio)
assert.notStrictEqual(await hashPassword("x"), await hashPassword("x"));

console.log("password.check.ts OK");
