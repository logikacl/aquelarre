import { backendPost } from "@/lib/backend";
import type { MesRow } from "@/convex/churn";

// El layout de /admin ya declara force-dynamic.

const COLS: [keyof MesRow, string][] = [
  ["mes", "Mes"],
  ["activasInicio", "Activas al inicio"],
  ["nuevas", "Nuevas"],
  ["bajas", "Bajas"],
  ["activasFin", "Activas al cierre"],
  ["churnPct", "Churn %"],
];

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-surface-container rounded-xl p-5">
      <div className="text-sm text-on-surface-variant">{titulo}</div>
      <div className="text-3xl font-headline font-bold mt-1">{valor}</div>
    </div>
  );
}

export default async function Churn() {
  const { mensual } = await backendPost<{ mensual: MesRow[] }>("/api/admin/churn", {}, "admin");
  const ultimo = mensual.at(-1);

  return (
    <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-headline font-bold">Churn</h1>

      {!ultimo ? (
        // Sin eventos de suscripción todavía: mostrar cero tarjetas es peor que decirlo.
        <p className="text-on-surface-variant">
          Aún no hay historial de suscripciones. Las métricas aparecerán con el primer mes de movimiento.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Tarjeta titulo="Activas hoy" valor={String(ultimo.activasFin)} />
            <Tarjeta titulo={`Bajas de ${ultimo.mes}`} valor={String(ultimo.bajas)} />
            <Tarjeta titulo={`Churn de ${ultimo.mes}`} valor={`${ultimo.churnPct}%`} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/30 text-left text-on-surface-variant">
                  {COLS.map(([k, label]) => <th key={k} className="py-2 pr-4 font-normal">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {mensual.map((r) => (
                  <tr key={r.mes} className="border-b border-outline/10">
                    {COLS.map(([k]) => (
                      <td key={k} className="py-2 pr-4 tabular-nums">
                        {k === "churnPct" ? `${r[k]}%` : r[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <a href="/admin/churn/reporte?tipo=mensual" download
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">Descargar CSV mensual</a>
        <a href="/admin/churn/reporte?tipo=eventos" download
          className="px-5 py-2 rounded-lg bg-surface-container border border-outline/30 font-bold">Descargar CSV de eventos</a>
      </div>
    </main>
  );
}
