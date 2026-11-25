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
import { httpAction, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendEmail } from "./email";
import { costoFireworks, debeAvisar, DIAS_STOCK, evaluar, parsePrecio, proyectar, type Lectura } from "./monitorRules";

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

// Saldo prepago de Fireworks: su API no lo expone, así que Ignacio lo dicta (a Hermi, tras cada
// carga) y de ahí se descuenta el consumo calculado. Una fila por proveedor.
export const getSaldo = internalQuery({
  args: {},
  handler: (ctx) => ctx.db.query("saldos").withIndex("by_proveedor", (q) => q.eq("proveedor", "fireworks")).unique(),
});

export const setSaldo = internalMutation({
  args: { usd: v.number() },
  handler: async (ctx, { usd }) => {
    const prev = await ctx.db.query("saldos").withIndex("by_proveedor", (q) => q.eq("proveedor", "fireworks")).unique();
    if (prev) await ctx.db.patch(prev._id, { usd, at: Date.now() });
    else await ctx.db.insert("saldos", { proveedor: "fireworks", usd, at: Date.now() });
  },
});

const DIA = 24 * 3600 * 1000;

async function leerFireworks(saldo: { usd: number; at: number } | null): Promise<Lectura["fireworks"]> {
  try {
    const h = { Authorization: `Bearer ${process.env.FIREWORKS_API}` };
    const acc = await fetch("https://api.fireworks.ai/v1/accounts", { headers: h }).then((r) => r.json());
    const id = acc.accounts?.[0]?.name; // "accounts/<id>"
    if (!id) return { error: "sin cuenta" };
    const precio = parsePrecio(process.env.FIREWORKS_PRECIO);
    const fin = Date.now();
    const uso = async (desde: number) => {
      const q = `startTime=${new Date(desde).toISOString()}&endTime=${new Date(fin).toISOString()}`;
      const r = await fetch(`https://api.fireworks.ai/v1/${id}/billingUsage?${q}`, { headers: h });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return costoFireworks(await r.json(), precio);
    };
    // ponytail: tres consultas (24 h, semana, desde el saldo) en vez de partir una sola; son
    // baratas y corren una vez al día o cuando Hermi pregunta.
    const [dia, semana, desdeSaldo] = await Promise.all([
      uso(fin - DIA),
      uso(fin - 7 * DIA),
      saldo ? uso(saldo.at) : null,
    ]);
    const estimado = saldo && desdeSaldo ? saldo.usd - desdeSaldo.usd : null;
    return {
      tokens: dia.tokens,
      usd: dia.usd,
      porModelo: dia.porModelo,
      ...proyectar(semana.porDia, estimado),
      saldo: estimado,
      saldoAl: saldo ? new Date(saldo.at).toISOString() : null,
    };
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

// Lee todo y arma el texto, sin mandar nada. La usan el cron (revisar) y GET /monitor (Hermi).
export const leer = internalAction({
  args: {},
  handler: async (ctx) => {
    const saldo = await ctx.runQuery(internal.monitor.getSaldo, {});
    const [fireworks, whatsapp, web, convex] = await Promise.all([
      leerFireworks(saldo),
      leerWhatsApp(),
      leerWeb(),
      ctx.runQuery(internal.monitor.conteos, {}),
    ]);
    const lectura: Lectura = { fireworks, whatsapp, web, convex };
    const problemas = evaluar(lectura, {
      tokensDia: num("MONITOR_TOKENS_DIA", 2_000_000),
      mensajes: num("MONITOR_MENSAJES", 200_000),
    });
    const texto = [
      problemas.length ? `PROBLEMAS:\n- ${problemas.join("\n- ")}\n` : "Todo en orden.\n",
      "error" in fireworks
        ? `Fireworks: ${fireworks.error}`
        : [
            `Fireworks 24 h: ${fireworks.tokens} tokens, US$${fireworks.usd.toFixed(3)} ${JSON.stringify(fireworks.porModelo)}`,
            `Fireworks proyección: promedio US$${fireworks.promedioDia.toFixed(3)}/día, peor día US$${fireworks.picoDia.toFixed(3)}, ` +
              `30 días ~US$${fireworks.proyeccion30.toFixed(2)}`,
            `Fireworks saldo: ${fireworks.saldo === null ? "no registrado" : `~US$${fireworks.saldo.toFixed(2)} (registrado ${fireworks.saldoAl}), cubre ${fireworks.diasCobertura?.toFixed(1)} días`}; ` +
              `stock de seguridad (${DIAS_STOCK} días) US$${fireworks.stock.toFixed(2)}`,
          ].join("\n"),
      `WhatsApp: ${JSON.stringify(whatsapp)}`,
      `Web: ${JSON.stringify(web)}`,
      `Convex: ${JSON.stringify(convex)}`,
      "",
      "El saldo de Fireworks es estimado (último registrado − consumo calculado); el real está en su panel.",
    ].join("\n");
    return { problemas, lectura, texto };
  },
});

export const revisar = internalAction({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.runAction(internal.monitor.leer, {});
    console.log(`[monitor] ${r.texto}`);
    await correo(`${r.problemas.length ? "⚠️" : "✅"} Silente: resumen diario`, r.texto);
    return r;
  },
});

// GET /monitor con "Authorization: Bearer <MONITOR_TOKEN>": lo consulta Hermi (InstaBox, el
// proxy inyecta el token). Solo conteos y consumo, ningún dato de usuarios. Token propio y no
// ADMIN_API_SECRET, que abre todo el admin.
export const monitorHttp = httpAction(async (ctx, req) => {
  const token = process.env.MONITOR_TOKEN;
  if (!token || req.headers.get("Authorization") !== `Bearer ${token}`)
    return new Response("no autorizado", { status: 401 });
  const r = await ctx.runAction(internal.monitor.leer, {});
  return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
});

// POST /monitor/saldo {"usd": 25}: registra el saldo de Fireworks que Ignacio ve en su panel.
export const saldoHttp = httpAction(async (ctx, req) => {
  const token = process.env.MONITOR_TOKEN;
  if (!token || req.headers.get("Authorization") !== `Bearer ${token}`)
    return new Response("no autorizado", { status: 401 });
  const usd = Number((await req.json().catch(() => ({})))?.usd);
  if (!Number.isFinite(usd) || usd < 0 || usd > 100_000)
    return new Response(JSON.stringify({ error: "usd debe ser un número entre 0 y 100000" }), { status: 400 });
  await ctx.runMutation(internal.monitor.setSaldo, { usd });
  return new Response(JSON.stringify({ ok: true, usd }), { headers: { "Content-Type": "application/json" } });
});
