// Lógica pura de churn (sin Convex) → testeable con churn.check.ts.

export type SubEvent = { email: string; status: string; at: number };

export type MesRow = {
  mes: string; // "2026-07"
  activasInicio: number;
  nuevas: number;
  bajas: number;
  activasFin: number;
  churnPct: number;
};

// ponytail: solo "active" cuenta como activa — "pending" es intención de pago, no ingreso.
// Si algún día se quiere medir el embudo, se agrega una serie aparte, no se mezcla acá.
const BAJA = new Set(["paused", "cancelled", "deleted"]);

// El reporte lo lee un negocio chileno: el corte de mes es en hora local, no UTC —
// si no, una baja del 31 a las 21:30 en Santiago aparece en el mes siguiente.
// "en-CA" da "YYYY-MM-DD", así que el slice deja "YYYY-MM".
const mesDe = (at: number) =>
  new Date(at).toLocaleDateString("en-CA", { timeZone: "America/Santiago" }).slice(0, 7);

const mesSiguiente = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export function churnMensual(events: SubEvent[]): MesRow[] {
  if (events.length === 0) return [];
  const orden = [...events].sort((a, b) => a.at - b.at); // los eventos pueden venir desordenados

  // Una transición cuenta solo si cambia la pertenencia al set: dos "active" seguidos
  // no son dos altas, y cancelar a alguien ya inactivo no es una baja.
  const activos = new Set<string>();
  const porMes = new Map<string, { nuevas: number; bajas: number }>();

  for (const e of orden) {
    const mes = mesDe(e.at);
    let acc = porMes.get(mes);
    if (!acc) porMes.set(mes, (acc = { nuevas: 0, bajas: 0 }));
    if (e.status === "active") {
      if (!activos.has(e.email)) {
        activos.add(e.email);
        acc.nuevas++;
      }
    } else if (BAJA.has(e.status) && activos.delete(e.email)) {
      acc.bajas++;
    }
    // "pending" no mueve nada: un re-checkout de alguien ya activo no es baja.
  }

  // Todos los meses del rango, incluidos los sin movimiento (arrastran el saldo).
  const ultimo = mesDe(orden[orden.length - 1].at);
  const rows: MesRow[] = [];
  let saldo = 0;
  for (let mes = mesDe(orden[0].at); ; mes = mesSiguiente(mes)) {
    const { nuevas, bajas } = porMes.get(mes) ?? { nuevas: 0, bajas: 0 };
    const activasInicio = saldo;
    saldo = activasInicio + nuevas - bajas;
    rows.push({
      mes,
      activasInicio,
      nuevas,
      bajas,
      activasFin: saldo,
      // Sin base al inicio del mes no hay churn que medir (evita NaN/Infinity).
      churnPct: activasInicio === 0 ? 0 : Math.round((bajas / activasInicio) * 1000) / 10,
    });
    if (mes === ultimo) return rows;
  }
}
