import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { clp } from "@/lib/format";

type PublicData = { priceClp: number };

export default async function Planes() {
  const { priceClp } = await backendGet<PublicData>("/api/public/oracles");

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter mb-6 text-on-surface">
          Un solo plan, <span className="text-primary italic">acceso completo</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
          Sin niveles ni letra chica. Suscríbete y conversa con tu oráculo por Telegram cuando lo necesites.
        </p>
      </section>

      <section className="max-w-md mx-auto bg-surface-container p-10 rounded-[2.5rem] flex flex-col border border-primary/40 mb-24">
        <div className="mb-8">
          <span className="text-primary font-bold uppercase tracking-widest text-xs">Suscripción mensual</span>
          <h2 className="text-3xl font-bold mt-2">Acceso a tu oráculo</h2>
        </div>
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-4xl font-bold">{clp(priceClp)}</span>
          <span className="text-on-surface-variant">/ mes</span>
        </div>
        <ul className="space-y-4 mb-10 flex-grow">
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>Conversación 1:1 con tu oráculo por Telegram</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>Historial continuo de tus consultas</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>Carta natal derivada de tu nacimiento</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>Disponible 24/7</span>
          </li>
        </ul>
        <Link
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-center hover:opacity-90 transition-all"
          href="/checkout"
        >
          Suscribirme
        </Link>
      </section>

      <section>
        <h2 className="text-3xl font-headline font-bold text-center mb-12 text-on-surface">Qué incluye</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">💬</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Sin esperas</h3>
              <p className="text-on-surface-variant text-sm">
                Tu oráculo responde en tu chat de Telegram, a cualquier hora del día.
              </p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">🔒</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Privacidad</h3>
              <p className="text-on-surface-variant text-sm">
                Conversaciones privadas, aisladas por chat y nunca compartidas con terceros.
              </p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">🪐</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Contexto real</h3>
              <p className="text-on-surface-variant text-sm">
                Respuestas basadas en tu carta natal derivada y el tránsito astral actual.
              </p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">🗂️</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Memoria continua</h3>
              <p className="text-on-surface-variant text-sm">
                Retoma la conversación donde la dejaste, o empieza de cero con /nueva.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
