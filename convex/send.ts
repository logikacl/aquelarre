// Único punto de salida hacia el consultante.
import { sendWhatsApp, sendWhatsAppButtons, waNumber } from "./whatsapp";

export const send = (chatId: number, text: string) => sendWhatsApp(waNumber(chatId), text);

// Pedir consentimiento va con botón: en WhatsApp nadie escribe comandos, y exigirlos era
// perder gente en el primer contacto. El botón devuelve el id "acepto", que http.ts lee
// como si el usuario lo hubiera escrito.
export const pedirConsentimiento = (chatId: number, cuerpo: string) =>
  sendWhatsAppButtons(waNumber(chatId), cuerpo, [{ id: "acepto", title: "Acepto" }]);

// Oferta de promociones a quien escribe sin suscripción: el botón vuelve con el id "promos"
// (ver esAltaPromos). Título de 16 caracteres; el límite de la API es 20.
export const ofrecerPromos = (chatId: number, cuerpo: string) =>
  sendWhatsAppButtons(waNumber(chatId), cuerpo, [{ id: "promos", title: "Quiero novedades" }]);
