"use server";
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!(session as any)?.isAdmin) throw new Error("no autorizado");
}

// Las páginas de marketing leen precio, oráculos y copy con un caché de 60s: sin esto,
// lo que el admin acaba de guardar no se ve hasta que expire.
function revalidarPublico() {
  revalidatePath("/");
  revalidatePath("/planes");
  revalidatePath("/oraculos/[slug]", "page");
}

// El admin necesita el motivo real del fallo (p. ej. el 400 "system es obligatorio", o el
// 404 cuando no hay preapproval en MercadoPago). Next redacta el mensaje de los throw de
// Server Actions en producción, así que el error viaja como dato de retorno, no como
// excepción: si no, el botón simplemente no hace nada y el admin cree que guardó.
async function backend(path: string, body: unknown) {
  try {
    await backendPost(path, body, "admin");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error desconocido" };
  }
}

// "layout" revalida /admin y todo su subárbol; el default ("page") solo tocaría /admin
// y dejaba /admin/oraculos sirviendo datos viejos tras guardar.
const revalidarAdmin = () => revalidatePath("/admin", "layout");

export async function setPrice(priceClp: number) {
  await assertAdmin();
  const err = await backend("/api/admin/config/set", { priceClp });
  if (err) return err;
  revalidarAdmin();
  revalidarPublico();
}

export async function upsertOracle(data: {
  slug: string; name: string; system: string;
  specialty?: string; bio?: string; photoUrl?: string; published: boolean; order: number;
}) {
  await assertAdmin();
  const err = await backend("/api/admin/oracles/upsert", data);
  if (err) return err;
  revalidarAdmin();
  revalidarPublico();
}

export async function deleteOracle(slug: string) {
  await assertAdmin();
  const err = await backend("/api/admin/oracles/delete", { slug });
  if (err) return err;
  revalidarAdmin();
  revalidarPublico();
}

export async function setUserSubscription(email: string, action: "pause" | "reactivate" | "cancel") {
  await assertAdmin();
  const err = await backend("/api/admin/users/action", { email, action });
  if (err) return err;
  revalidarAdmin();
}

export async function deleteUser(email: string) {
  await assertAdmin();
  const err = await backend("/api/admin/users/delete", { email });
  if (err) return err;
  revalidarAdmin();
}

// value vacío ⇒ el backend borra la fila y la clave vuelve al default de lib/copy.ts.
export async function setContent(key: string, value: string) {
  await assertAdmin();
  const err = await backend("/api/admin/content/set", { key, value });
  if (err) return err;
  revalidarAdmin();
  revalidarPublico();
}
