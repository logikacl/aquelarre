import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendTelegram } from "./telegram";
import { parseFecha, parseHora, fmtHora, noSabeHora, isoFecha } from "./birth";
import { natalChart } from "./astro";
import { buscarCiudad } from "./cities";

const titulo = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const CONSENT_VERSION = "2026-07-17";

const WELCOME = `Hola. Soy un oráculo: conversamos en privado sobre lo que traes hoy, mirándolo a través de la astrología simbólica.

Antes de empezar: nuestras conversaciones se guardan para darte continuidad, y se procesan con un modelo de IA (incluida transferencia a servidores en EE.UU.). Puedes pedir borrar todo tu historial cuando quieras.

Si estás de acuerdo, escribe /acepto para comenzar.`;

const NEED_CONSENT = `Para conversar necesito tu consentimiento. Escribe /start para ver de qué se trata y luego /acepto.`;

const askBirth = (nombre: string) =>
  `Gracias, ${nombre}. ✨ Para leer tu carta necesito saber dónde y cuándo naciste.

¿En qué ciudad y en qué fecha naciste? (por ejemplo: Santiago, 15 de marzo de 1990)`;

const ASK_TIME = `Perfecto. ¿Sabes tu hora de nacimiento? Me sirve para calcular tu ascendente.

Dímela como 14:30 — o escribe "no sé" si no la tienes.`;

const ok = () => new Response(null, { status: 200 });

const handler = httpAction(async (ctx, req) => {
  // Verifica que el POST venga de Telegram (secret token del webhook).
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await req.json();
  const msg = update.message;
  if (!msg?.text || typeof msg.chat?.id !== "number") return ok(); // ignora updates sin texto

  const chatId = msg.chat.id as number;
  const text = (msg.text as string).trim();
  const nombre = (msg.from?.first_name || msg.from?.username || "consultante") as string;

  if (text === "/start") {
    await ctx.runMutation(internal.messages.ensureConversation, { chatId });
    await sendTelegram(chatId, WELCOME);
    return ok();
  }
  if (text === "/acepto") {
    await ctx.runMutation(internal.messages.recordConsent, { chatId, version: CONSENT_VERSION });
    await sendTelegram(chatId, askBirth(nombre));
    return ok();
  }

  const convo = await ctx.runQuery(internal.messages.getConversation, { chatId });

  // Puerta de consentimiento (Ley 21.719): nada llega al oráculo sin consentimiento previo.
  if (!convo?.consented) {
    await sendTelegram(chatId, NEED_CONSENT);
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
      await sendTelegram(chatId, `${anote}Me falta tu fecha de nacimiento — dámela como 22/03/1977 o "22 de marzo de 1977".`);
      return ok();
    }

    await ctx.runMutation(internal.messages.saveBirthDate, { chatId, place, date: isoFecha(fecha) });
    await sendTelegram(chatId, ASK_TIME);
    return ok();
  }

  // Onboarding paso 2: hora (o "no sé") → confeccionar carta.
  if (convo.onboarding === "time") {
    const hora = parseHora(text);
    if (!hora && !noSabeHora(text)) {
      await sendTelegram(chatId, '¿Me das la hora como 14:30, o escribe "no sé"?');
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
    await sendTelegram(chatId, `Listo, ${nombre}. ${carta}\n\nCuéntame, ¿qué te trae hoy?`);
    return ok();
  }

  if (text === "/nueva") {
    await ctx.runMutation(internal.messages.resetSession, { chatId });
    await sendTelegram(chatId, "Empecemos una lectura nueva. ¿Qué quieres mirar?");
    return ok();
  }

  // Stub de paywall — Fase 1 sin pago.
  // ponytail: acceso siempre permitido; reemplazar por chequeo de suscripción Flow en Fase 2.

  await ctx.runMutation(internal.messages.addMessage, { chatId, role: "user", content: text });
  await ctx.scheduler.runAfter(0, internal.oracle.respond, { chatId }); // responde async, 200 inmediato
  return ok();
});

const http = httpRouter();
http.route({ path: "/telegram", method: "POST", handler });
export default http;
