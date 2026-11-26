// Promociones por WhatsApp: quién las aceptó, y el embudo clic → chat del botón del home.
import { httpAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { chileDay } from "./quota";

// Versión de la Política de Privacidad que declara esta finalidad (lib/legal.tsx VERSION).
// Se guarda con cada alta para acreditar a qué texto consintió la persona.
export const PROMOS_VERSION = "2026-11-25";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const guard = (req: Request, header: string, secret: string | undefined) =>
  req.headers.get(header) === secret ? null : new Response("unauthorized", { status: 401 });

const porChat = (ctx: { db: any }, chatId: number) =>
  ctx.db.query("promos").withIndex("by_chat", (q: any) => q.eq("chatId", chatId)).unique();

export const tiene = internalQuery({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => (await porChat(ctx, chatId)) !== null,
});

export const alta = internalMutation({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const prev = await porChat(ctx, chatId);
    const fila = { chatId, version: PROMOS_VERSION, at: Date.now() };
    if (prev) await ctx.db.patch(prev._id, fila);
    else await ctx.db.insert("promos", fila);
  },
});

export const baja = internalMutation({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const prev = await porChat(ctx, chatId);
    if (prev) await ctx.db.delete(prev._id);
  },
});

export const contarClic = internalMutation({
  args: {},
  handler: async (ctx) => {
    const day = chileDay();
    const prev = await ctx.db.query("clicks").withIndex("by_day", (q) => q.eq("day", day)).unique();
    if (prev) await ctx.db.patch(prev._id, { count: prev.count + 1 });
    else await ctx.db.insert("clicks", { day, count: 1 });
  },
});

// Lista de aceptaciones + embudo de los últimos 30 días: clics en el botón del home y chats
// nuevos (primera vez que un número le escribe al bot, suscrito o no).
export const reporte = internalQuery({
  args: {},
  handler: async (ctx) => {
    const desde = Date.now() - 30 * 24 * 3600 * 1000;
    const optins = (await ctx.db.query("promos").collect()).map(({ chatId, version, at }) => ({ chatId, version, at }));
    const clics = await ctx.db.query("clicks").withIndex("by_day", (q) => q.gte("day", chileDay(desde))).collect();
    // ponytail: recorre la tabla entera; con miles de chats, índice por fecha de creación.
    const chats = await ctx.db.query("conversations").filter((q) => q.gte(q.field("_creationTime"), desde)).collect();
    const dias = new Map<string, { day: string; clics: number; chats: number }>();
    const dia = (day: string) => dias.get(day) ?? dias.set(day, { day, clics: 0, chats: 0 }).get(day)!;
    for (const c of clics) dia(c.day).clics += c.count;
    for (const c of chats) dia(chileDay(c._creationTime)).chats += 1;
    return { optins, embudo: [...dias.values()].sort((a, b) => b.day.localeCompare(a.day)) };
  },
});

// POST /api/admin/promos (admin) → { optins, embudo }
export const promosReport = httpAction(async (ctx, req) => {
  const bad = guard(req, "X-Admin-Api-Secret", process.env.ADMIN_API_SECRET);
  if (bad) return bad;
  return json(await ctx.runQuery(internal.promos.reporte, {}));
});

// POST /api/clicks/wa (web) → cuenta un clic del botón del home. Lo llama /wa del front.
export const clicWa = httpAction(async (ctx, req) => {
  const bad = guard(req, "X-Web-Api-Secret", process.env.WEB_API_SECRET);
  if (bad) return bad;
  await ctx.runMutation(internal.promos.contarClic, {});
  return json({ ok: true });
});
