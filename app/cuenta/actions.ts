"use server";
import { auth, signOut } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function email(): Promise<string> {
  const session = await auth();
  const e = session?.user?.email;
  if (!e) throw new Error("no autenticado");
  return e;
}

export async function changeSubscription(action: "no_renovar" | "cancel") {
  await backendPost("/api/subscription/action", { email: await email(), action }, "web");
  revalidatePath("/cuenta");
}

export async function deleteAccount() {
  await backendPost("/api/subscription/delete", { email: await email() }, "web");
  await signOut({ redirectTo: "/" });
}

// Solo estas dos páginas muestran el formulario del número. `volver` viene del formulario,
// así que se valida contra una lista cerrada: aceptarlo tal cual sería un redirect abierto.
const DESTINOS = new Set(["/cuenta", "/suscripcion/listo"]);

export async function guardarTelefono(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/ingresar");

  const pedido = String(formData.get("volver") ?? "");
  const volver = DESTINOS.has(pedido) ? pedido : "/cuenta";

  // El correo sale de la sesión, nunca del formulario: nadie cambia el número de otra cuenta.
  let fallo = false;
  try {
    await backendPost(
      "/api/account/phone",
      { email: session.user.email, phone: String(formData.get("telefono") ?? "") },
      "web",
    );
  } catch {
    fallo = true;
  }
  redirect(`${volver}?${fallo ? "error" : "ok"}=telefono`);
}
