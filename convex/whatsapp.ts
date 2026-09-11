// Canal WhatsApp (Cloud API). Helpers planos, no funciones Convex.
//
// `chatId` es el wa_id tal cual (E.164 sin +, cabe de sobra en un entero seguro). Hubo un
// desplazamiento +1e14 mientras convivía con Telegram, para que los identificadores de los
// dos canales no chocaran en las mismas tablas; al quedar WhatsApp como único canal dejó de
// tener sentido y se quitó, junto con los datos de prueba que lo usaban.
//
// OJO: esto significa que la clave primaria del historial ES el teléfono del consultante.
// La spec original lo prohibía, pero con WhatsApp no hay alternativa — el wa_id es el
// número. Consecuencia práctica: si alguien cambia de teléfono, pierde su historial, y el
// borrado por `deleteByChat` es lo que cumple la supresión de Ley 21.719.
export const waChatId = (waId: string) => Number(waId);
export const waNumber = (chatId: number) => String(chatId);

// Valida X-Hub-Signature-256 ("sha256=<hex>") contra el app secret de Meta.
// crypto.subtle.verify hace la comparación en tiempo constante — por eso se usa verify
// y no un === contra el hex recalculado, que filtra la firma por timing.
export async function validaFirmaMeta(header: string | null, body: string): Promise<boolean> {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const hex = header.slice(7);
  if (hex.length !== 64 || !/^[0-9a-f]+$/i.test(hex)) return false;

  const sig = Uint8Array.from(hex.match(/../g)!.map((b) => parseInt(b, 16)));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(body));
}

async function waPost(payload: Record<string, unknown>) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TOKEN_ACCESS_WABA}`,
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp sendMessage ${res.status}: ${await res.text()}`);
  }
}

export const sendWhatsApp = (to: string, text: string) =>
  waPost({ to, type: "text", text: { body: text } });

// Mensaje con botones de respuesta rápida. El `id` del botón vuelve por el webhook y
// http.ts lo trata como si el usuario hubiera escrito esa palabra: un tap en "Acepto"
// entra por el mismo camino que escribir "acepto", sin lógica aparte.
// Límites de la API: hasta 3 botones, `title` de 20 caracteres, cuerpo de 1024.
export const sendWhatsAppButtons = (
  to: string,
  text: string,
  buttons: { id: string; title: string }[],
) =>
  waPost({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: b })) },
    },
  });
