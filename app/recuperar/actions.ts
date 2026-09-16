"use server";
import { backendPost } from "@/lib/backend";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

// Los redirect van siempre fuera del try: dentro, el catch se comería su NEXT_REDIRECT.

export async function pedirEnlace(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // Convex responde lo mismo exista o no la cuenta; un error acá es falla de verdad
  // (backend caído), y decirlo no revela nada sobre quién está registrado.
  let fallo = false;
  try {
    await backendPost("/api/auth/reset/request", { email }, "web");
  } catch {
    fallo = true;
  }
  redirect(fallo ? "/recuperar?error=1" : "/recuperar?enviado=1");
}

export async function fijarClave(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const volver = (error: string) => `/recuperar/nueva?token=${encodeURIComponent(token)}&error=${error}`;

  if (password !== confirm) redirect(volver("distintas"));

  let email = "";
  let fallo = "";
  try {
    const r = await backendPost<{ ok: true; email: string }>("/api/auth/reset/confirm", { token, password }, "web");
    email = r.email;
  } catch (e) {
    fallo = String(e);
  }
  // Clave débil: el enlace sigue vivo, se vuelve al mismo formulario a corregir.
  if (fallo.includes("débil")) redirect(volver("debil"));
  if (fallo) redirect("/recuperar?error=vencido");

  // Entra directo: acaba de demostrar que controla el correo, pedirle la clave otra vez
  // sería un paso sin propósito. Si esto fallara, /cuenta está protegida y cae en /ingresar.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // sin sesión: el middleware lo manda a iniciar sesión, con la clave nueva ya guardada
  }
  redirect("/cuenta");
}
