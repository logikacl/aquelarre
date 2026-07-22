"use server";
import { auth, signOut } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function email(): Promise<string> {
  const session = await auth();
  const e = session?.user?.email;
  if (!e) throw new Error("no autenticado");
  return e;
}

export async function changeSubscription(action: "pause" | "reactivate" | "cancel") {
  await backendPost("/api/subscription/action", { email: await email(), action }, "web");
  revalidatePath("/cuenta");
}

export async function deleteAccount() {
  await backendPost("/api/subscription/delete", { email: await email() }, "web");
  await signOut({ redirectTo: "/" });
}
