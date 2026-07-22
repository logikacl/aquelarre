import { backendPost } from "@/lib/backend";
import PriceEditor from "@/components/PriceEditor";
import OracleForm from "@/components/OracleForm";

// El panel admin debe leer precio/perfiles frescos en cada carga (no cachear en build).
export const dynamic = "force-dynamic";

export default async function Admin() {
  const config = await backendPost<{ priceClp: number; reason: string }>("/api/admin/config", {}, "admin");
  const oracles = await backendPost<any[]>("/api/admin/oracles", {}, "admin");
  return (
    <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto space-y-12">
      <section>
        <h1 className="text-3xl font-headline font-bold mb-6">Precio</h1>
        <PriceEditor current={config.priceClp} />
      </section>
      <section>
        <h2 className="text-2xl font-headline font-bold mb-6">Oráculos</h2>
        <div className="space-y-6">
          {oracles.map((o) => <OracleForm key={o.slug} oracle={o} />)}
          <div>
            <h3 className="font-bold mb-2">Nuevo oráculo</h3>
            <OracleForm />
          </div>
        </div>
      </section>
    </main>
  );
}
