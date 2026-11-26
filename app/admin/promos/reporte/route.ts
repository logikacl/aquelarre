import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { toCsv } from "@/lib/csv";
import { fechaHoraCL, isoCL } from "@/lib/format";
import type { PromosReporte } from "../page";

// CSV de quienes aceptaron promociones, en E.164 para importarlo en la herramienta de
// campañas. Mismo borde de confianza que el CSV de churn.
export async function GET() {
  const session = await auth();
  if (!session || !(session as any).isAdmin) return new Response("No autorizado", { status: 401 });

  const { optins } = await backendPost<PromosReporte>("/api/admin/promos", {}, "admin");
  const filas = optins.map((o) => ({
    WhatsApp: `+${o.chatId}`,
    Aceptó: fechaHoraCL(o.at),
    "Versión de la política": o.version,
  }));
  // BOM: Excel en español lee UTF-8 solo con él (ver app/admin/churn/reporte/route.ts).
  return new Response("﻿" + toCsv(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="promos-${isoCL(Date.now())}.csv"`,
    },
  });
}
