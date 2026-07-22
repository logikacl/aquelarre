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

  await signIn("credentials", { email, password, redirect: false });

  const { initPoint } = await backendPost<{ initPoint: string; linkToken: string }>(
    "/api/checkout",
    { email },
    "web",
  );
  redirect(initPoint); // a MercadoPago
}
