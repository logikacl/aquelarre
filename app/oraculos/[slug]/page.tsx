import Link from "next/link";
import { notFound } from "next/navigation";
import { backendGet } from "@/lib/backend";

type Oracle = { slug: string; name: string; specialty: string | null; bio: string | null; photoUrl: string | null };
type PublicData = { oracles: Oracle[]; priceClp: number };

export default async function Perfil({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Next 15: params is a Promise
  const { oracles } = await backendGet<PublicData>("/api/public/oracles");
  const oracle = oracles.find((o) => o.slug === slug);
  if (!oracle) notFound();

  return (
    <main className="pt-28 pb-20 px-4 max-w-7xl mx-auto space-y-16">
      {/* Profile Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-2xl overflow-hidden border border-primary/10 aspect-square">
            {oracle.photoUrl ? (
              <img className="w-full h-full object-cover" src={oracle.photoUrl} alt={oracle.name} />
            ) : (
              <div className="w-full h-full bg-surface-container" />
            )}
          </div>
        </div>
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            {oracle.specialty && (
              <div className="flex items-center gap-2 text-primary">
                <span>✨</span>
                <span className="uppercase tracking-[0.2em] text-xs font-bold">{oracle.specialty}</span>
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter text-on-surface">
              {oracle.name}
            </h1>
            {oracle.bio && (
              <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">{oracle.bio}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:opacity-90 transition-all active:scale-95"
              href="/checkout"
            >
              Suscribirme para hablar con {oracle.name}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative rounded-3xl overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center py-16">
        <div className="relative z-10 text-center space-y-6 max-w-2xl px-6">
          <h2 className="text-4xl font-headline font-bold text-on-surface">¿Listo para conocer tu destino?</h2>
          <p className="text-on-surface-variant text-lg">
            El universo habla un lenguaje que solo {oracle.name} puede traducir para ti hoy mismo.
          </p>
          <div className="flex justify-center">
            <Link
              className="bg-primary text-on-primary px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform inline-flex items-center gap-4"
              href="/checkout"
            >
              Comenzar Lectura Ahora
              <span>🚀</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
