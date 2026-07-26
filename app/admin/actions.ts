"use server";
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!(session as any)?.isAdmin) throw new Error("no autorizado");
}

// "layout" revalida /admin y todo su subárbol; el default ("page") solo tocaría /admin
// y dejaba /admin/oraculos sirviendo datos viejos tras guardar.
export async function setPrice(priceClp: number) {
  await assertAdmin();
  await backendPost("/api/admin/config/set", { priceClp }, "admin");
  revalidatePath("/admin", "layout");
}

export async function upsertOracle(data: {
  slug: string; name: string; system: string;
  specialty?: string; bio?: string; photoUrl?: string; published: boolean; order: number;
}) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/upsert", data, "admin");
  revalidatePath("/admin", "layout");
}

export async function deleteOracle(slug: string) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/delete", { slug }, "admin");
  revalidatePath("/admin", "layout");
}

// El admin necesita el motivo real del fallo (p. ej. el 404 cuando no hay preapproval en
// MercadoPago), y Next redacta el mensaje de los throw de Server Actions en producción:
// por eso el error viaja como dato de retorno en vez de excepción.
export async function setUserSubscription(email: string, action: "pause" | "reactivate" | "cancel") {
  await assertAdmin();
  try {
    await backendPost("/api/admin/users/action", { email, action }, "admin");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error desconocido" };
  }
  revalidatePath("/admin/usuarios");
}

export async function deleteUser(email: string) {
  await assertAdmin();
  try {
    await backendPost("/api/admin/users/delete", { email }, "admin");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error desconocido" };
  }
  revalidatePath("/admin/usuarios");
}

// value vacío ⇒ el backend borra la fila y la clave vuelve al default de lib/copy.ts.
// El error viaja como retorno (mismo motivo que arriba: Next redacta los throw en prod).
export async function setContent(key: string, value: string) {
  await assertAdmin();
  try {
    await backendPost("/api/admin/content/set", { key, value }, "admin");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error desconocido" };
  }
  revalidatePath("/admin", "layout");
  // El copy vive en las páginas públicas: sin esto el cambio no se ve hasta que expire el caché.
  revalidatePath("/");
  revalidatePath("/planes");
  revalidatePath("/oraculos/[slug]", "page");
}
