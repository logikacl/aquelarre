import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { hashPassword, verifyPassword } from "./password";
import { passwordValida } from "./passwordRules";
import { normalizarTelefono } from "./telefono";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): Response | null {
  if (req.headers.get("X-Web-Api-Secret") !== process.env.WEB_API_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// POST /api/auth/register { name, email, password, phone } → { ok } | { ok:false, error }
export const register = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { name, email, password, phone } = await req.json();
  if (typeof email !== "string" || !email.includes("@") || typeof password !== "string") {
    return json({ ok: false, error: "email inválido" }, 400);
  }
  // Existencia antes que fortaleza: el checkout también lo usa quien ya tiene cuenta para
  // volver a pagar, y su clave de antes de estas reglas tiene que seguir sirviendo.
  if (await ctx.runQuery(internal.users.getByEmail, { email })) {
    return json({ ok: false, error: "email ya registrado" }, 409);
  }
  if (!passwordValida(password, email)) {
    return json({ ok: false, error: "contraseña débil" }, 400);
  }
  // Se normaliza acá aunque la web ya lo haya hecho: este es el que manda.
  const telefono = typeof phone === "string" ? normalizarTelefono(phone) : null;
  if (telefono === null) {
    return json({ ok: false, error: "teléfono inválido" }, 400);
  }
  const passwordHash = await hashPassword(password);
  const res = await ctx.runMutation(internal.users.create, {
    email,
    name: typeof name === "string" ? name : "",
    passwordHash,
    phone: telefono,
  });
  return json(res, res.ok ? 200 : 409);
});

// POST /api/auth/login { email, password } → { email, name } | 401
export const login = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, password } = await req.json();
  const user = await ctx.runQuery(internal.users.getByEmail, { email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "credenciales inválidas" }, 401);
  }
  return json({ email: user.email, name: user.name });
});

// POST /api/account/phone { email, phone } → { ok } | 400 { error }
// Solo lo llama la web con la sesión ya verificada (el email sale de la sesión, no del form).
export const accountPhone = httpAction(async (ctx, req) => {
  const bad = checkSecret(req);
  if (bad) return bad;
  const { email, phone } = await req.json();
  const telefono = typeof phone === "string" ? normalizarTelefono(phone) : null;
  if (typeof email !== "string" || telefono === null) {
    return json({ ok: false, error: "teléfono inválido" }, 400);
  }
  const ok = await ctx.runMutation(internal.users.setPhone, { email, phone: telefono });
  return ok ? json({ ok: true }) : json({ ok: false, error: "cuenta no existe" }, 400);
});
