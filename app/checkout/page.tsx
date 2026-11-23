import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { registerAndCheckout } from "./actions";
import PasswordFields from "@/components/PasswordFields";
import PhoneInput from "@/components/PhoneInput";
import { bulletsVisibles, elegirPlan } from "@/convex/planRules";
import { clp } from "@/lib/format";
import type { PublicPlan } from "@/components/silente/PlanCards";

// Checkout de Silente: el layout de Esteban (silente-web/app/checkout) sobre nuestro flujo
// real (server action → Reveniu → Transbank). El plan llega por ?plan=<slug>.

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--silente-border)] bg-[rgba(5,14,22,.72)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--silente-ivory)] outline-none placeholder:text-[var(--silente-muted)] focus:border-[var(--silente-gold)] focus:ring-2 focus:ring-[rgba(213,170,75,.16)]";
const labelClass = "block text-xs font-medium uppercase tracking-[.12em] text-[var(--silente-muted)]";

// `?error=` lo ponen la server action y Reveniu (pago fallido → redirect_to_failure del plan).
const ERRORES: Record<string, string> = {
  pago: "El pago no se completó. Puedes intentarlo de nuevo.",
  distintas: "Las contraseñas no coinciden.",
  debil: "La contraseña no cumple los requisitos: al menos 10 caracteres, mayúsculas, minúsculas y un número.",
  registro: "No pudimos crear tu cuenta. Intenta de nuevo en un momento.",
  telefono: "Revisa tu número de WhatsApp: escribe tu celular, por ejemplo 9 1234 5678.",
};

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--silente-gold)]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

export const metadata = { title: "Finalizar suscripción · Silente" };

export default async function Checkout({ searchParams }: { searchParams: Promise<{ error?: string; plan?: string }> }) {
  const { error, plan: slug } = await searchParams;
  const plans = await backendGet<PublicPlan[]>("/api/public/plans");
  // La lista pública ya trae solo publicados; elegirPlan cae al primero si el slug no existe.
  const plan = elegirPlan(plans.map((p, order) => ({ ...p, published: true, order })), slug);
  const mensajeError = error ? ERRORES[error] : undefined;

  if (!plan) {
    return (
      <main className="px-5 pb-20 pt-32 text-center md:px-8">
        <h1 className="text-3xl font-semibold">Pronto abriremos las suscripciones.</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--silente-night)] px-5 pb-20 pt-28 text-[var(--silente-ivory)] md:px-8 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[.22em] text-[var(--silente-gold)]">{plan.name}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] md:text-5xl">Finalizar suscripción</h1>
          <p className="mt-3 text-sm text-[var(--silente-muted)] md:text-base">Estás a un paso de conversar con Luna.</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.8fr)] lg:gap-8">
          <section className="rounded-3xl border border-[var(--silente-border)] bg-[var(--silente-secondary)] p-6 md:p-9">
            <div className="mb-8 flex items-center gap-4">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--silente-gold)] text-sm text-[var(--silente-gold-light)]">1</span>
              <h2 className="text-xl font-semibold md:text-2xl">Datos de registro</h2>
            </div>

            <form action={registerAndCheckout} className="space-y-5">
              <input type="hidden" name="plan" value={plan.slug} />
              {mensajeError && (
                <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
                  {mensajeError}
                </p>
              )}
              <label className={labelClass}>
                Nombre completo
                <input className={inputClass} name="name" autoComplete="name" placeholder="Tu nombre" required />
              </label>
              <label className={labelClass}>
                Correo electrónico
                <input className={inputClass} name="email" type="email" autoComplete="email" placeholder="tu@correo.cl" required />
              </label>
              <div>
                <label className={labelClass} htmlFor="telefono">Tu WhatsApp</label>
                <PhoneInput className={inputClass} />
                <p className="text-xs leading-5 text-[var(--silente-muted)]">
                  Es el número desde el que conversarás con Luna: tu suscripción se conecta cuando le escribes desde ahí.
                </p>
              </div>
              <PasswordFields inputClass={inputClass} labelClass={labelClass} />

              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-full bg-[var(--silente-gold)] px-6 py-4 font-semibold text-[var(--silente-night)] transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)]"
              >
                <span>Activar mi suscripción</span>
                <span aria-hidden="true">→</span>
              </button>
              <p className="text-center text-xs leading-5 text-[var(--silente-muted)]">
                Serás redirigido a Webpay de Transbank para completar el pago de forma segura.
              </p>
            </form>

            <p className="mt-7 text-xs leading-6 text-[var(--silente-muted)]">
              Al crear tu cuenta aceptas los{" "}
              <Link className="text-[var(--silente-gold-light)] underline underline-offset-4" href="/terminos">Términos y Condiciones</Link>{" "}
              y la <Link className="text-[var(--silente-gold-light)] underline underline-offset-4" href="/privacidad">Política de Privacidad</Link>.
              El consentimiento para procesar tus conversaciones se pide aparte, en el chat, antes de la primera lectura.
            </p>
            <p className="mt-4 text-center text-sm text-[var(--silente-muted)]">
              ¿Ya tienes cuenta?{" "}
              <Link className="text-[var(--silente-gold-light)] underline underline-offset-4" href="/ingresar">Inicia sesión</Link>.
            </p>
          </section>

          <aside className="rounded-3xl border border-[rgba(213,170,75,.38)] bg-[rgba(23,35,49,.72)] p-6 md:p-8 lg:sticky lg:top-8">
            <p className="text-xs uppercase tracking-[.18em] text-[var(--silente-gold)]">Resumen del plan</p>
            <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
            <div className="mt-7 border-y border-[var(--silente-border)] py-6">
              <p className="text-sm text-[var(--silente-muted)]">Suscripción mensual</p>
              <p className="mt-2 text-3xl font-semibold">
                {clp(plan.priceClp).replace(" CLP", "")} <span className="text-base font-normal text-[var(--silente-muted)]">CLP / mes</span>
              </p>
            </div>
            <ul className="mt-6 space-y-4 text-sm">
              {bulletsVisibles(plan).map((b) => (
                <li key={b} className="flex items-start gap-3"><Check />{b}</li>
              ))}
            </ul>
            <div className="mt-8 flex items-center justify-between border-t border-[var(--silente-border)] pt-6 text-sm">
              <span>Total mensual · IVA incluido</span>
              <strong className="text-base text-[var(--silente-ivory)]">{clp(plan.priceClp)}</strong>
            </div>
            {plans.length > 1 && (
              <p className="mt-5 text-center text-xs text-[var(--silente-muted)]">
                <Link className="underline underline-offset-4" href="/#elige-tu-plan">Ver otros planes</Link>
              </p>
            )}
            <div className="mt-5 flex justify-center gap-5 text-[10px] font-semibold tracking-[.12em] text-[var(--silente-muted)]">
              <span>🔒 PAGO SEGURO</span>
              <span>🛡️ CIFRADO SSL</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
