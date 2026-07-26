// CSV mínimo (RFC 4180): cabecera + filas. Sin librería: son 10 líneas.

// Se cita solo cuando hace falta, y las comillas internas se duplican.
const celda = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  // ponytail: la cabecera sale de la primera fila; asumimos filas homogéneas (las arma el server).
  const cols = Object.keys(rows[0]);
  return [cols, ...rows.map((r) => cols.map((c) => r[c] ?? ""))]
    .map((f) => f.map(celda).join(","))
    .join("\r\n");
}
