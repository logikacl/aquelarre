"use server";
import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  // authorize() devolviendo null se manifiesta de dos formas según la versión de
  // next-auth: lanza CredentialsSignin, o retorna la URL del signin con ?error=.
  // El redirect va fuera del try para no comerse su NEXT_REDIRECT.
  let dest = "/cuenta";
  try {
    const url = await signIn("credentials", { email, password, redirect: false });
    if (String(url).includes("error=")) dest = "/ingresar?error=1";
  } catch {
    dest = "/ingresar?error=1";
  }
  redirect(dest);
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
