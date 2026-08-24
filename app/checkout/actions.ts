"use server";
import { backendPost } from "@/lib/backend";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerAndCheckout(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const reg = await backendPost<{ ok: boolean; error?: string }>(
    "/api/auth/register",
    { name, email, password },
    "web",
  );
  // Si ya estaba registrado, seguimos igual (puede reintentar el pago); otros errores se lanzan.
  if (!reg.ok && reg.error && !reg.error.includes("ya registrado")) {
    throw new Error(reg.error);
  }

  // El email ya existía y la clave no coincide → no es un registro, es un login fallido:
  // mandarlo a /ingresar en vez de cobrarle. Ver nota en app/ingresar/actions.ts.
  let signedIn = true;
  try {
    const url = await signIn("credentials", { email, password, redirect: false });
    signedIn = !String(url).includes("error=");
  } catch {
    signedIn = false;
  }
  if (!signedIn) redirect("/ingresar?error=1");

  // El backend se llama desde /suscripcion/pagar, que necesita renderizar el form POST
  // hacia Transbank: desde acá no se puede, un redirect() solo hace GET.
  redirect("/suscripcion/pagar");
}
