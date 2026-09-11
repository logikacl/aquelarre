// Check del canal WhatsApp: mapeo wa_id↔chatId y firma de Meta. Correr: npx tsx whatsapp.check.ts
import assert from "node:assert";
import { waChatId, waNumber, validaFirmaMeta } from "./convex/whatsapp.ts";

// El wa_id sobrevive la ida y vuelta sin perder dígitos.
for (const wa of ["56912345678", "56991951638", "1", "999999999999999"]) {
  assert.strictEqual(waNumber(waChatId(wa)), wa, `ida y vuelta: ${wa}`);
  assert.ok(Number.isSafeInteger(waChatId(wa)), `entero seguro: ${wa}`); // 15 dígitos = máximo E.164
}

// Firma: solo pasa el HMAC correcto con el secret correcto.
process.env.META_APP_SECRET = "s3cr3t";
const body = '{"entry":[{"changes":[]}]}';
const hmac = async (secret: string) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
};

assert.strictEqual(await validaFirmaMeta(`sha256=${await hmac("s3cr3t")}`, body), true);
assert.strictEqual(await validaFirmaMeta(`sha256=${await hmac("otro")}`, body), false);
assert.strictEqual(await validaFirmaMeta(`sha256=${await hmac("s3cr3t")}`, body + " "), false); // cuerpo alterado
assert.strictEqual(await validaFirmaMeta(null, body), false); // sin header
assert.strictEqual(await validaFirmaMeta("sha256=nohex", body), false);

console.log("whatsapp.check.ts OK");
