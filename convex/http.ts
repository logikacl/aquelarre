import { httpRouter } from "convex/server";
import { httpAction, type ActionCtx } from "./_generated/server";
import { waChatId, validaFirmaMeta } from "./whatsapp";
import { formatearTelefono } from "./telefono";
import { internal } from "./_generated/api";
import { send, pedirConsentimiento } from "./send";
import { parseFecha, parseHora, fmtHora, noSabeHora, isoFecha } from "./birth";
import { natalChart } from "./astro";
import { buscarCiudad } from "./cities";
import { parseStartToken, esConsentimiento } from "./subscription";
import {
  checkout, subscription, subscriptionAction, subscriptionDelete, reveniuWebhook,
} from "./webapi";
import {
  getConfig, setConfig, listOracles, upsertOracle, publishOracle, deleteOracle,
  listUsersAdmin, userAction, userDelete, churnReport,
  getContent, setContent, uploadImage,
} from "./admin";
import { register, login, accountPhone } from "./authapi";
import { resetRequest, resetConfirm } from "./reset";
import { publicOracles, publicContent } from "./publicapi";
import { DAILY_LIMIT } from "./quota";

const titulo = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const CONSENT_VERSION = "2026-07-17";

const WELCOME = `Hola. Soy un oráculo: conversamos en privado sobre lo que traes hoy, mirándolo a través de la astrología simbólica.

Antes de empezar: nuestras conversaciones se guardan para darte continuidad, y se procesan con un modelo de IA (incluida transferencia a servidores en EE.UU.). Puedes pedir borrar todo tu historial cuando quieras.

`;

const NEED_CONSENT = `Para conversar necesito antes tu consentimiento. Te lo cuento de nuevo:`;

// Le dice desde qué número escribe: el caso más común de quien ya pagó y llega acá es que
// registró otro número (o lo escribió mal) en su cuenta, y sin ese dato no lo descubre.
const needSubscription = (chatId: number) => `Para conversar con el oráculo necesitas una suscripción activa.

Estás escribiendo desde ${formatearTelefono(chatId)}.

• Si ya pagaste: entra a ${process.env.WEB_BASE_URL}/cuenta y revisa que ese sea el número de WhatsApp de tu cuenta. Apenas lo corrijas, vuelve a escribirme.
• Si aún no te suscribes: ${process.env.WEB_BASE_URL}`;

const askBirth = (nombre: string) =>
  `Gracias, ${nombre}. ✨ Para leer tu carta necesito saber dónde y cuándo naciste.

¿En qué ciudad y en qué fecha naciste? (por ejemplo: Santiago, 15 de marzo de 1990)`;

const ASK_TIME = `Perfecto. ¿Sabes tu hora de nacimiento? Me sirve para calcular tu ascendente.

Dímela como 14:30 — o escribe "no sé" si no la tienes.`;

const ok = () => new Response(null, { status: 200 });

// Único filtro de entrada: largo. No hay lista negra de "ignora tus instrucciones" — daría
// falsos positivos en consultas reales y no aporta: el modelo no tiene herramientas, ni
// secretos en el prompt más allá de la persona, y el peor caso (jailbreak) lo acota la cuota.
const MAX_LEN = 2000;
const TOO_LONG = `Ese mensaje es muy largo para una lectura. Resúmelo en menos de ${MAX_LEN} caracteres y te leo.`;
const NO_QUOTA = `Llegaste a tus ${DAILY_LIMIT} consultas de hoy. Mañana seguimos — a veces conviene dejar que lo hablado repose.`;

// El corazón del bot. Recibe un mensaje ya normalizado: el webhook de WhatsApp solo aporta
// el parseo de su formato, así que nada de acá abajo sabe de la API de Meta.
type Incoming = { chatId: number; text: string; nombre: string };

const handleMessage = async (ctx: ActionCtx, { chatId, text, nombre }: Incoming) => {
  if (text.length > MAX_LEN) {
    await send(chatId, TOO_LONG);
    return ok();
  }

  const convo = await ctx.runQuery(internal.messages.getConversation, { chatId });

  // Arranque: "esta persona escribe y todavía no existe". En WhatsApp nadie escribe
  // comandos, y exigirlos era perder gente en el primer contacto. `/start <código>` se acepta
  // todavía por el enlace viejo con código (ver el ponytail de linkToken en schema.ts).
  const esStart = text === "/start" || text.startsWith("/start ") || text.startsWith("/start@");
  if (esStart || !convo) {
    await ctx.runMutation(internal.messages.ensureConversation, { chatId });
    const token = parseStartToken(text);
    if (token) {
      // Deep-link desde la web tras pagar: amarra este chatId a la suscripción.
      await ctx.runMutation(internal.subscriptions.linkChat, { linkToken: token, chatId });
    }
    await pedirConsentimiento(chatId, WELCOME);
    return ok();
  }

  // Consentimiento: el botón de WhatsApp llega como "acepto" y entra por acá igual que el
  // comando. Solo vale una afirmación inequívoca — "ok" o "sí" no son consentimiento
  // explícito de Ley 21.719 y no se aceptan por más que sea tentador facilitarlo.
  if (esConsentimiento(text)) {
    await ctx.runMutation(internal.messages.recordConsent, { chatId, version: CONSENT_VERSION });
    const active = await ctx.runMutation(internal.subscriptions.activaOVincula, { chatId });
    await send(chatId, active ? askBirth(nombre) : needSubscription(chatId));
    return ok();
  }

  // Puerta de consentimiento (Ley 21.719): nada llega al oráculo sin consentimiento previo.
  if (!convo.consented) {
    await pedirConsentimiento(chatId, `${NEED_CONSENT}\n\n${WELCOME}`);
    return ok();
  }

  // Puerta de suscripción: nada de onboarding ni oráculo sin suscripción activa. Si el chat
  // todavía no está enlazado, se enlaza acá por el número registrado en la cuenta.
  const activeSub = await ctx.runMutation(internal.subscriptions.activaOVincula, { chatId });
  if (!activeSub) {
    await send(chatId, needSubscription(chatId));
    return ok();
  }

  // Onboarding paso 1: ciudad + fecha, acumulando entre mensajes y en cualquier orden.
  if (convo.onboarding === "birth") {
    const fecha = parseFecha(text);
    const ciudad = buscarCiudad(text); // ciudad conocida en el texto (o null)
    const place = ciudad?.name ?? convo.birthPlace; // no pierde la ciudad previa

    if (!fecha) {
      if (ciudad) await ctx.runMutation(internal.messages.saveBirthPlace, { chatId, place: ciudad.name });
      const anote = ciudad ? `Anoté ${titulo(ciudad.name)}. ` : "";
      await send(chatId, `${anote}Me falta tu fecha de nacimiento — dámela como 22/03/1977 o "22 de marzo de 1977".`);
      return ok();
    }

    await ctx.runMutation(internal.messages.saveBirthDate, { chatId, place, date: isoFecha(fecha) });
    await send(chatId, ASK_TIME);
    return ok();
  }

  // Onboarding paso 2: hora (o "no sé") → confeccionar carta.
  if (convo.onboarding === "time") {
    const hora = parseHora(text);
    if (!hora && !noSabeHora(text)) {
      await send(chatId, '¿Me das la hora como 14:30, o escribe "no sé"?');
      return ok();
    }
    const time = hora ? fmtHora(hora) : null;
    const coords = buscarCiudad(convo.birthPlace ?? "");
    const astro = natalChart(convo.birthDate!, time, coords); // asc solo si hay hora + ciudad
    await ctx.runMutation(internal.messages.finishOnboarding, { chatId, time, astro });

    let carta = `Tu Sol está en ${astro.sun} y tu Luna en ${astro.moon}`;
    carta += astro.asc ? `, con ascendente ${astro.asc}.` : ".";
    if (!astro.asc) {
      carta += hora
        ? " (No reconocí tu ciudad, así que aún no calculo el ascendente.)"
        : " (Sin tu hora exacta no puedo calcular el ascendente todavía.)";
    }
    await send(chatId, `Listo, ${nombre}. ${carta}\n\nCuéntame, ¿qué te trae hoy?`);
    return ok();
  }

  if (text === "/nueva") {
    await ctx.runMutation(internal.messages.resetSession, { chatId });
    await send(chatId, "Empecemos una lectura nueva. ¿Qué quieres mirar?");
    return ok();
  }

  // Cuota diaria: solo las consultas al oráculo la gastan (comandos y onboarding no).
  if (!(await ctx.runMutation(internal.messages.consumeQuota, { chatId }))) {
    await send(chatId, NO_QUOTA);
    return ok();
  }

  await ctx.runMutation(internal.messages.addMessage, { chatId, role: "user", content: text });
  await ctx.scheduler.runAfter(0, internal.oracle.respond, { chatId }); // responde async, 200 inmediato
  return ok();
};

// Handshake de suscripción del webhook de Meta: responde el challenge en texto plano.
const whatsappVerify = httpAction(async (_ctx, req) => {
  const q = new URL(req.url).searchParams;
  if (q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
});

const whatsappHandler = httpAction(async (ctx, req) => {
  // Meta firma el cuerpo con el app secret (SHA-256 HMAC); sin esto cualquiera
  // puede POSTear mensajes falsos a esta URL, que es pública.
  const raw = await req.text();
  if (!(await validaFirmaMeta(req.headers.get("X-Hub-Signature-256"), raw))) {
    console.log("[wa] firma inválida — se rechaza");
    return new Response("forbidden", { status: 403 });
  }

  const value = JSON.parse(raw).entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  // Un botón no llega como texto: viene en interactive.button_reply. Se normaliza a su `id`
  // para que el resto del bot no sepa que existen los botones.
  const texto: string | undefined =
    msg?.type === "text"
      ? msg.text?.body
      : msg?.type === "interactive"
        ? msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id
        : undefined;
  // Diagnóstico: qué clase de evento llegó, nunca el contenido del mensaje.
  const est = value?.statuses?.[0];
  console.log(
    `[wa] ${msg ? `mensaje tipo=${msg.type}` : est ? `estado=${est.status}${est.errors ? ` err=${JSON.stringify(est.errors)}` : ""}` : "evento sin mensajes ni estados"}`,
  );
  // Ignora lo que no sea texto ni botón: los "statuses" (entregado/leído) llegan por el
  // mismo webhook y son la mayoría del tráfico. Un audio o una foto tampoco tienen qué hacer.
  if (!texto || typeof msg.from !== "string") return ok();

  return handleMessage(ctx, {
    chatId: waChatId(msg.from), // wa_id → chatId desplazado, ver whatsapp.ts
    text: texto.trim(),
    nombre: value.contacts?.[0]?.profile?.name || "consultante",
  });
});

const http = httpRouter();
http.route({ path: "/whatsapp", method: "GET", handler: whatsappVerify });
http.route({ path: "/whatsapp", method: "POST", handler: whatsappHandler });
http.route({ path: "/api/checkout", method: "POST", handler: checkout });
http.route({ path: "/api/subscription", method: "POST", handler: subscription });
http.route({ path: "/api/subscription/action", method: "POST", handler: subscriptionAction });
http.route({ path: "/api/subscription/delete", method: "POST", handler: subscriptionDelete });
http.route({ path: "/reveniu", method: "POST", handler: reveniuWebhook });
http.route({ path: "/api/admin/config", method: "POST", handler: getConfig });
http.route({ path: "/api/admin/config/set", method: "POST", handler: setConfig });
http.route({ path: "/api/admin/oracles", method: "POST", handler: listOracles });
http.route({ path: "/api/admin/oracles/upsert", method: "POST", handler: upsertOracle });
http.route({ path: "/api/admin/oracles/publish", method: "POST", handler: publishOracle });
http.route({ path: "/api/admin/oracles/delete", method: "POST", handler: deleteOracle });
http.route({ path: "/api/admin/users", method: "POST", handler: listUsersAdmin });
http.route({ path: "/api/admin/users/action", method: "POST", handler: userAction });
http.route({ path: "/api/admin/users/delete", method: "POST", handler: userDelete });
http.route({ path: "/api/admin/churn", method: "POST", handler: churnReport });
http.route({ path: "/api/admin/content", method: "POST", handler: getContent });
http.route({ path: "/api/admin/content/set", method: "POST", handler: setContent });
http.route({ path: "/api/admin/upload", method: "POST", handler: uploadImage });
http.route({ path: "/api/auth/register", method: "POST", handler: register });
http.route({ path: "/api/auth/login", method: "POST", handler: login });
http.route({ path: "/api/auth/reset/request", method: "POST", handler: resetRequest });
http.route({ path: "/api/auth/reset/confirm", method: "POST", handler: resetConfirm });
http.route({ path: "/api/account/phone", method: "POST", handler: accountPhone });
http.route({ path: "/api/public/oracles", method: "GET", handler: publicOracles });
http.route({ path: "/api/public/content", method: "GET", handler: publicContent });
export default http;
