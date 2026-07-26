import { backendPost } from "@/lib/backend";
import OracleForm, { type Oracle } from "@/components/OracleForm";

export default async function AdminOraculos() {
  // El endpoint admin devuelve la fila completa (incluido system) y ya viene ordenada por `order`.
  const oracles = await backendPost<Oracle[]>("/api/admin/oracles", {}, "admin");
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-headline font-bold">Astrólogos</h2>
      <div className="space-y-6">
        {oracles.map((o) => (
          <OracleForm key={o.slug} oracle={o} />
        ))}
      </div>
      <div>
        <h3 className="font-headline font-bold mb-2">Nuevo oráculo</h3>
        <OracleForm />
      </div>
    </section>
  );
}
