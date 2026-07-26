import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { toCsv } from "@/lib/csv";
import type { MesRow, SubEvent } from "@/convex/churn";
import { fechaHoraCL, isoCL } from "@/lib/format";

export async function GET(req: Request) {
  // middleware.ts ya cubre /admin/*, pero esto es un borde de confianza: se verifica igual.
  const session = await auth();
  if (!session || !(session as any).isAdmin) return new Response("No autorizado", { status: 401 });

  const tipo = new URL(req.url).searchParams.get("tipo");
  if (tipo !== "mensual" && tipo !== "eventos") return new Response("tipo inválido", { status: 400 });

  const data = await backendPost<{ mensual: MesRow[]; eventos: SubEvent[] }>(
    "/api/admin/churn", {}, "admin",
  );

  const filas = tipo === "mensual"
    ? data.mensual.map((r) => ({
        Mes: r.mes,
        "Activas al inicio": r.activasInicio,
        Nuevas: r.nuevas,
        Bajas: r.bajas,
        "Activas al cierre": r.activasFin,
        "Churn %": r.churnPct,
      }))
    : data.eventos.map((e) => ({
        // Los usuarios que ejercieron supresión (Ley 21.719) quedan como "anon:<token>":
        // de ahí que la columna sea "identificador" y no "email".
        Identificador: e.email,
        Estado: e.status,
        Fecha: fechaHoraCL(e.at),
        "Timestamp (ms)": e.at, // para auditar sin depender del formateo
      }));

  const hoy = isoCL(Date.now());
  // El BOM es lo único que hace que Excel en español lea el archivo como UTF-8; sin él los
  // acentos salen rotos. Escapado y no literal: un formateador o una config de git se comen
  // un U+FEFF crudo sin dejar rastro en el diff.
  return new Response("\uFEFF" + toCsv(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="churn-${tipo}-${hoy}.csv"`,
    },
  });
}
