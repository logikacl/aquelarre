import { backendPost } from "@/lib/backend";
import PlanEditor, { type AdminPlan } from "@/components/PlanEditor";

export default async function Admin() {
  const plans = await backendPost<AdminPlan[]>("/api/admin/plans", {}, "admin");
  // Sin filas en la tabla el backend devuelve el plan de respaldo (sin reveniuPlanId propio
  // si la env no lo trae): guardarlo una vez lo convierte en una fila real.
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-headline font-bold">Planes</h2>
      {plans.map((p) => (
        <PlanEditor key={p.slug} plan={p} />
      ))}
      <div className="space-y-3">
        <h3 className="font-headline font-bold">Nuevo plan</h3>
        <PlanEditor nuevo />
      </div>
    </section>
  );
}
