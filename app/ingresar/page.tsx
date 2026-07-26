import Link from "next/link";
import { login } from "./actions";

const input =
  "w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface";
const label = "text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1";

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="pt-32 pb-20 px-6 max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
        Iniciar sesión
      </h1>
      <p className="text-on-surface-variant mt-2 mb-8">
        Entra a tu cuenta para gestionar tu suscripción.
      </p>

      <section className="bg-surface-container p-6 md:p-8 rounded-xl border border-outline/30">
        <form action={login} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg py-3 px-4">
              Correo o contraseña incorrectos.
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
          <div className="space-y-2">
            <label className={label} htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className={input}
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>
          <button
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all active:scale-95"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </section>

      <p className="text-sm text-on-surface-variant text-center mt-6">
        ¿Aún no tienes cuenta?{" "}
        <Link className="underline text-primary" href="/checkout">
          Suscríbete
        </Link>
        .
      </p>
    </main>
  );
}
