import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { clp } from "@/lib/format";
import { registerAndCheckout } from "./actions";
import PasswordFields from "@/components/PasswordFields";
import PhoneInput from "@/components/PhoneInput";

type PublicData = { priceClp: number };

const inputClass =
  "w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1";

// `?error=` lo ponen la server action y Reveniu (pago fallido → redirect_to_failure del plan).
const ERRORES: Record<string, string> = {
  pago: "El pago no se completó. Puedes intentarlo de nuevo.",
  distintas: "Las contraseñas no coinciden.",
  debil: "La contraseña no cumple los requisitos: al menos 10 caracteres, mayúsculas, minúsculas y un número.",
  registro: "No pudimos crear tu cuenta. Intenta de nuevo en un momento.",
  telefono: "Revisa tu número de WhatsApp: escribe tu celular, por ejemplo 9 1234 5678.",
};

export default async function Checkout({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { priceClp } = await backendGet<PublicData>("/api/public/oracles");
  const { error } = await searchParams;
  const mensajeError = error ? ERRORES[error] : undefined;

  return (
    <main className="pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
          Finalizar suscripción
        </h1>
        <p className="text-on-surface-variant mt-2">Estás a un paso de conectar con el cosmos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna izquierda: registro */}
        <div className="lg:col-span-7">
          <section className="bg-surface-container p-6 md:p-8 rounded-xl border border-outline/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold text-on-surface">Datos de registro</h2>
            </div>
            <form action={registerAndCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mensajeError && (
                <p
                  className="md:col-span-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg py-3 px-4"
                  role="alert"
                >
                  {mensajeError}
                </p>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">
                  Nombre completo
                </label>
                <input
                  className="w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface"
                  name="name"
                  placeholder="Ej. Alex Vega"
                  required
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">
                  Correo electrónico
                </label>
                <input
                  className="w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface"
                  name="email"
                  placeholder="alex@cosmos.com"
                  required
                  type="email"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={labelClass} htmlFor="telefono">
                  Tu WhatsApp
                </label>
                <PhoneInput className={inputClass} />
                <p className="text-xs text-on-surface-variant ml-1">
                  Es el número desde el que vas a conversar con el oráculo: tu suscripción se conecta sola en
                  cuanto le escribas desde ahí.
                </p>
              </div>
              <PasswordFields inputClass={inputClass} labelClass={labelClass} />
              <button
                className="md:col-span-2 w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                type="submit"
              >
                Activar mi destino
                <span aria-hidden="true">✨</span>
              </button>
              <p className="md:col-span-2 text-xs text-on-surface-variant text-center">
                Serás redirigido a Webpay de Transbank para completar el pago de forma segura.
              </p>
              <p className="md:col-span-2 text-xs text-on-surface-variant text-center">
                Al crear tu cuenta aceptas los{" "}
                <Link className="underline" href="/terminos">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link className="underline" href="/privacidad">
                  Política de Privacidad
                </Link>
                . El consentimiento para procesar tus conversaciones se pide aparte, en el chat, antes de la primera
                lectura.
              </p>
              <p className="md:col-span-2 text-sm text-on-surface-variant text-center">
                ¿Ya tienes cuenta?{" "}
                <Link className="underline text-primary" href="/ingresar">
                  Inicia sesión
                </Link>
                .
              </p>
            </form>
          </section>
        </div>

        {/* Columna derecha: resumen */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container p-8 rounded-2xl border border-primary/20 sticky top-28">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-on-surface">Resumen del plan</h2>
              <span aria-hidden="true" className="text-primary text-xl">
                🌟
              </span>
            </div>
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-primary">Acceso a tu oráculo</h3>
                  <p className="text-xs text-on-surface-variant">Suscripción mensual</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-on-surface">{clp(priceClp)}</span>
                  <span className="text-[10px] block text-on-surface-variant">/ mes</span>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="text-primary" aria-hidden="true">✓</span>
                  Conversación ilimitada por WhatsApp
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="text-primary" aria-hidden="true">✓</span>
                  Disponibilidad 24/7
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="text-primary" aria-hidden="true">✓</span>
                  Carta natal personalizada
                </li>
              </ul>
              <div className="pt-6 border-t border-outline/30 space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-on-surface">Total</span>
                  <span className="text-primary">{clp(priceClp)} / mes</span>
                </div>
                <p className="text-xs text-on-surface-variant text-right">IVA incluido</p>
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] text-on-surface-variant uppercase tracking-widest pt-2">
                <span>🔒 Pago seguro</span>
                <span>🛡️ Cifrado SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
