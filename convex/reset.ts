// Recuperación de contraseña: pedir enlace por correo → abrirlo → fijar clave nueva.
//
// Decisiones que no se ven en el código:
// - Se responde igual exista o no el correo: el formulario no sirve para averiguar quién
//   tiene cuenta.
// - Abrir el enlace no lo gasta. Los antivirus de correo abren los links antes que la
//   persona; si un GET lo consumiera, llegaría quemado. Se gasta al guardar la clave.
// - Si la clave nueva es débil, el enlace tampoco se gasta: la persona corrige y reintenta.
import { httpAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { hashPassword, sha256hex } from "./password";
import { passwordValida } from "./passwordRules";
import { newLinkToken } from "./subscription";
import { sendEmail } from "./email";

const VIGENCIA_MS = 60 * 60 * 1000;
// Freno al bombardeo: un mismo correo no recibe más de un enlace por minuto.
const ESPERA_MS = 60 * 1000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const autorizado = (req: Request) => req.headers.get("X-Web-Api-Secret") === process.env.WEB_API_SECRET;

export const crearReset = internalMutation({
  args: { email: v.string(), tokenHash: v.string() },
  handler: async (ctx, { email, tokenHash }) => {
    const now = Date.now();

    // Limpieza de paso: enlaces vencidos que nadie usó son un correo guardado sin propósito
    // (minimización, Ley 21.719). Barrer acá evita un cron para una tabla que casi no crece.
    const vencidos = await ctx.db
      .query("passwordResets")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .take(50);
    await Promise.all(vencidos.map((r) => ctx.db.delete(r._id)));

    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (!user) return { enviar: false };

    const previos = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (previos.some((r) => now - r.createdAt < ESPERA_MS)) return { enviar: false };
    // Un enlace vivo por cuenta: pedir otro invalida los anteriores.
    await Promise.all(previos.map((r) => ctx.db.delete(r._id)));

    await ctx.db.insert("passwordResets", { tokenHash, email, createdAt: now, expiresAt: now + VIGENCIA_MS });
    return { enviar: true };
  },
});

export const aplicarReset = internalMutation({
  args: { tokenHash: v.string(), password: v.string() },
  handler: async (ctx, { tokenHash, password }) => {
    const reset = await ctx.db
      .query("passwordResets")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!reset || reset.expiresAt < Date.now()) return { error: "enlace inválido" as const };

    if (!passwordValida(password, reset.email)) return { error: "contraseña débil" as const };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", reset.email))
      .unique();
    if (!user) return { error: "enlace inválido" as const }; // la cuenta se borró entre medio

    await ctx.db.patch(user._id, { passwordHash: await hashPassword(password) });
    const todos = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", reset.email))
      .collect();
    await Promise.all(todos.map((r) => ctx.db.delete(r._id)));
    return { email: reset.email };
  },
});

// POST /api/auth/reset/request { email } → { ok: true } siempre
export const resetRequest = httpAction(async (ctx, req) => {
  if (!autorizado(req)) return new Response("unauthorized", { status: 401 });
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) return json({ ok: true });
  const correo = email.trim().toLowerCase();

  const token = newLinkToken();
  const { enviar } = await ctx.runMutation(internal.reset.crearReset, {
    email: correo,
    tokenHash: await sha256hex(token),
  });

  if (enviar) {
    const link = `${process.env.WEB_BASE_URL}/recuperar/nueva?token=${token}`;
    try {
      await sendEmail({
        to: correo,
        subject: "Recupera tu contraseña · Astros x Chat",
        text: `Hola,

Recibimos una solicitud para cambiar la contraseña de tu cuenta en Astros x Chat.

Crea una nueva en este enlace. Vence en una hora y sirve una sola vez:
${link}

Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.`,
        html: `<p>Hola,</p>
<p>Recibimos una solicitud para cambiar la contraseña de tu cuenta en <strong>Astros x Chat</strong>.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#c2652a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Crear contraseña nueva</a></p>
<p style="color:#666;font-size:13px">El enlace vence en una hora y sirve una sola vez.</p>
<p style="color:#666;font-size:13px">Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.</p>`,
      });
    } catch (e) {
      // Sin rastro, "no me llegó el correo" es indistinguible de "no pedí nada". No se le
      // dice a quien pidió: la respuesta tiene que ser igual en todos los casos.
      console.log(`reset: fallo al enviar correo — ${String(e).slice(0, 200)}`);
    }
  }
  return json({ ok: true });
});

// POST /api/auth/reset/confirm { token, password } → { ok, email } | 400 { error }
export const resetConfirm = httpAction(async (ctx, req) => {
  if (!autorizado(req)) return new Response("unauthorized", { status: 401 });
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || typeof password !== "string") {
    return json({ ok: false, error: "enlace inválido" }, 400);
  }
  const r = await ctx.runMutation(internal.reset.aplicarReset, {
    tokenHash: await sha256hex(token),
    password,
  });
  return "error" in r ? json({ ok: false, error: r.error }, 400) : json({ ok: true, email: r.email });
});
