import Link from "next/link";
import { pedirEnlace } from "./actions";

export const metadata = { title: "Recuperar contraseña · Astros x Chat", robots: { index: false } };

const input =
  "w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface";
const label = "text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1";

const ERRORES: Record<string, string> = {
  vencido: "Ese enlace ya no sirve: venció o ya se usó. Pide uno nuevo.",
  "1": "No pudimos procesar la solicitud. Intenta de nuevo en un momento.",
};

export default async function Recuperar({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const { enviado, error } = await searchParams;

  return (
    <main className="pt-32 pb-20 px-6 max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
        Recuperar contraseña
      </h1>

      {enviado ? (
        <section className="mt-8 bg-surface-container p-6 md:p-8 rounded-xl border border-outline/30 space-y-3">
          {/* Mismo mensaje exista o no la cuenta: el formulario no sirve para averiguar quién
              está registrado. */}
          <p className="text-on-surface" role="status">
            Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.
          </p>
          <p className="text-sm text-on-surface-variant">
            Revisa también la carpeta de spam. El enlace vence en una hora y sirve una sola vez.
          </p>
          <p className="text-sm text-on-surface-variant pt-2">
            ¿No llegó?{" "}
            <Link className="underline text-primary" href="/recuperar">
              Pide otro
            </Link>
            .
          </p>
        </section>
      ) : (
        <>
          <p className="text-on-surface-variant mt-2 mb-8">
            Escribe el correo con que te registraste y te mandamos un enlace para crear una nueva.
          </p>
          <section className="bg-surface-container p-6 md:p-8 rounded-xl border border-outline/30">
            <form action={pedirEnlace} className="space-y-4">
              {error && ERRORES[error] && (
                <p
                  className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg py-3 px-4"
                  role="alert"
                >
                  {ERRORES[error]}
                </p>
              )}
              <div className="space-y-2">
                <label className={label} htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  autoComplete="email"
                  className={input}
                  id="email"
                  name="email"
                  placeholder="alex@cosmos.com"
                  required
                  type="email"
                />
              </div>
              <button
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all active:scale-95"
                type="submit"
              >
                Enviarme el enlace
              </button>
            </form>
          </section>
        </>
      )}

      <p className="text-sm text-on-surface-variant text-center mt-6">
        ¿Te acordaste?{" "}
        <Link className="underline text-primary" href="/ingresar">
          Inicia sesión
        </Link>
        .
      </p>
    </main>
  );
}
