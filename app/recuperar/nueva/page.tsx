import Link from "next/link";
import { redirect } from "next/navigation";
import PasswordFields from "@/components/PasswordFields";
import { fijarClave } from "../actions";

// El token viaja en la URL: sin referrer, si la página cargara algo externo, no se filtra.
export const metadata = {
  title: "Contraseña nueva · Astros x Chat",
  robots: { index: false },
  referrer: "no-referrer" as const,
};

const inputClass =
  "w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1";

const ERRORES: Record<string, string> = {
  distintas: "Las contraseñas no coinciden.",
  debil: "La contraseña no cumple los requisitos: al menos 10 caracteres, mayúsculas, minúsculas, un número, y que no contenga tu correo.",
};

export default async function NuevaClave({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  if (!token) redirect("/recuperar");
  // No se valida el token al abrir la página: abrirla no debe gastarlo ni revelar nada, y los
  // antivirus de correo la abren antes que la persona. Se valida al guardar.

  return (
    <main className="pt-32 pb-20 px-6 max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
        Crea tu contraseña nueva
      </h1>
      <p className="text-on-surface-variant mt-2 mb-8">Después de guardarla entras directo a tu cuenta.</p>

      <section className="bg-surface-container p-6 md:p-8 rounded-xl border border-outline/30">
        <form action={fijarClave} className="space-y-4">
          {error && ERRORES[error] && (
            <p
              className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg py-3 px-4"
              role="alert"
            >
              {ERRORES[error]}
            </p>
          )}
          <input name="token" type="hidden" value={token} />
          <PasswordFields inputClass={inputClass} labelClass={labelClass} />
          <button
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all active:scale-95"
            type="submit"
          >
            Guardar y entrar
          </button>
        </form>
      </section>

      <p className="text-sm text-on-surface-variant text-center mt-6">
        ¿El enlace no funciona?{" "}
        <Link className="underline text-primary" href="/recuperar">
          Pide uno nuevo
        </Link>
        .
      </p>
    </main>
  );
}
