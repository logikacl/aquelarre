"use server";
import { backendPost } from "@/lib/backend";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerAndCheckout(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // El formulario ya lo impide en vivo; esto es para quien lo salte (sin JS, o a mano).
  if (password !== confirm) redirect("/checkout?error=distintas");

  // backendPost lanza ante cualquier status no-2xx, y Convex responde 409 si el correo ya
  // existe: hay que atraparlo acá. Antes no se atrapaba, así que quien ya tenía cuenta y
  // volvía a pagar veía la página de error en vez de seguir. Los redirect van fuera del try
  // para no comerse su NEXT_REDIRECT.
  let fallo = "";
  try {
    await backendPost("/api/auth/register", { name, email, password }, "web");
  } catch (e) {
    fallo = String(e);
  }
  if (fallo.includes("débil")) redirect("/checkout?error=debil");
  // Si ya estaba registrado, seguimos: es alguien volviendo a pagar, se valida con su clave.
  if (fallo && !fallo.includes("ya registrado")) redirect("/checkout?error=registro");

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
