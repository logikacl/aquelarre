// Monitoreo de costos y capacidad: Fireworks (LLM), WhatsApp (Meta), Vercel (web) y Convex.
//
// Dos caminos:
// - `avisar`: alerta inmediata cuando una llamada falla en caliente (oracle.ts). Una por
//   clave cada 6 h (ver monitorRules.SILENCIO_MS).
// - `revisar`: resumen diario (crons.ts) con el consumo de las últimas 24 h; el asunto lleva
//   ⚠️ si algo cruzó un umbral.
//
// Lo que NO se puede leer por API y queda en los paneles de cada proveedor:
// - Saldo de créditos de Fireworks (prepago). La API da consumo, no saldo: activar auto
//   top-up y bajar los umbrales de aviso mensuales en el panel de Billing.
// - Uso del plan de Convex y de Vercel: ambos mandan sus propios correos de aviso al dueño
//   del equipo. Acá solo se vigila que la web responda y cuánto crece la base.
//
// Correo a ALERT_EMAIL (env de Convex). Umbrales por env, con defaults abajo.
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendEmail } from "./email";
import { debeAvisar, evaluar, sumarFireworks, type Lectura } from "./monitorRules";

const num = (k: string, d: number) => Number(process.env[k] ?? d);

export const marcar = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const prev = await ctx.db.query("alerts").withIndex("by_key", (q) => q.eq("key", key)).unique();
    const ahora = Date.now();
    if (!debeAvisar(prev?.at, ahora)) return false;
    if (prev) await ctx.db.patch(prev._id, { at: ahora });
    else await ctx.db.insert("alerts", { key, at: ahora });
    return true;
  },
});

async function correo(asunto: string, texto: string) {
  const to = process.env.ALERT_EMAIL;
  if (!to) return console.error(`[monitor] sin ALERT_EMAIL: ${asunto}\n${texto}`);
  const html = `<pre style="font-family:monospace">${texto.replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"))}</pre>`;
  await sendEmail({ to, subject: asunto, html, text: texto, tag: "monitor" });
}

export const avisar = internalAction({
  args: { key: v.string(), texto: v.string() },
  handler: async (ctx, { key, texto }) => {
    if (await ctx.runMutation(internal.monitor.marcar, { key })) await correo(`⚠️ Silente: ${key}`, texto);
  },
});

// ponytail: collect() lee la tabla entera; sirve hasta decenas de miles de filas. Pasar al
// componente @convex-dev/aggregate si `messages` crece más allá.
export const conteos = internalQuery({
  args: {},
  handler: async (ctx) => ({
    conversaciones: (await ctx.db.query("conversations").collect()).length,
    mensajes: (await ctx.db.query("messages").collect()).length,
  }),
});

const err = (e: unknown) => ({ error: e instanceof Error ? e.message : String(e) });

async function leerFireworks(): Promise<Lectura["fireworks"]> {
  try {
    const h = { Authorization: `Bearer ${process.env.FIREWORKS_API}` };
    const acc = await fetch("https://api.fireworks.ai/v1/accounts", { headers: h }).then((r) => r.json());
    const id = acc.accounts?.[0]?.name; // "accounts/<id>"
    if (!id) return { error: "sin cuenta" };
    const fin = new Date();
    const ini = new Date(fin.getTime() - 24 * 3600 * 1000);
    const q = `startTime=${ini.toISOString()}&endTime=${fin.toISOString()}`;
    const r = await fetch(`https://api.fireworks.ai/v1/${id}/billingUsage?${q}`, { headers: h });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return sumarFireworks(await r.json());
  } catch (e) {
    return err(e);
  }
}

async function leerWhatsApp(): Promise<Lectura["whatsapp"]> {
  try {
    // messaging_limit_tier está deprecado (mayo 2026); el reemplazo es este campo.
    const f = "quality_rating,status,whatsapp_business_manager_messaging_limit";
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}?fields=${f}`, {
      headers: { Authorization: `Bearer ${process.env.TOKEN_ACCESS_WABA}` },
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error?.message ?? `HTTP ${r.status}` }; // token vencido cae acá
    return { quality: d.quality_rating, status: d.status, limite: d.whatsapp_business_manager_messaging_limit };
  } catch (e) {
    return err(e);
  }
}

async function leerWeb(): Promise<Lectura["web"]> {
  try {
    const t = Date.now();
    const r = await fetch(process.env.WEB_BASE_URL!, { redirect: "follow" });
    return { status: r.status, ms: Date.now() - t };
  } catch (e) {
    return err(e);
  }
}

export const revisar = internalAction({
  args: {},
  handler: async (ctx) => {
    const [fireworks, whatsapp, web, convex] = await Promise.all([
      leerFireworks(),
      leerWhatsApp(),
      leerWeb(),
      ctx.runQuery(internal.monitor.conteos, {}),
    ]);
    const lectura: Lectura = { fireworks, whatsapp, web, convex };
    const problemas = evaluar(lectura, {
      usdDia: num("MONITOR_USD_DIA", 3),
      tokensDia: num("MONITOR_TOKENS_DIA", 2_000_000),
      mensajes: num("MONITOR_MENSAJES", 200_000),
    });
    const texto = [
      problemas.length ? `PROBLEMAS:\n- ${problemas.join("\n- ")}\n` : "Todo en orden.\n",
      `Fireworks (24 h): ${JSON.stringify(fireworks)}`,
      `WhatsApp: ${JSON.stringify(whatsapp)}`,
      `Web: ${JSON.stringify(web)}`,
      `Convex: ${JSON.stringify(convex)}`,
      "",
      "Saldo Fireworks, uso del plan Convex y Vercel: ver los paneles de cada proveedor.",
    ].join("\n");
    console.log(`[monitor] ${texto}`);
    await correo(`${problemas.length ? "⚠️" : "✅"} Silente: resumen diario`, texto);
    return { problemas, lectura };
  },
});
