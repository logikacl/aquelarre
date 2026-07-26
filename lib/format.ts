export const clp = (n: number) => `$${n.toLocaleString("es-CL")} CLP`;

// Todas las fechas del panel se leen en Chile: sin el timeZone explícito, el servidor
// (UTC en Vercel) y el navegador del admin muestran días distintos para el mismo dato.
export const fechaCL = (ms: number | null | undefined) =>
  ms == null ? "—" : new Date(ms).toLocaleDateString("es-CL", { timeZone: "America/Santiago" });

// Con hora, para los reportes: una baja del 31 a las 21:30 tiene que poder auditarse.
export const fechaHoraCL = (ms: number) =>
  new Date(ms).toLocaleString("es-CL", { timeZone: "America/Santiago" });

// "YYYY-MM-DD" en hora de Chile, para nombres de archivo ordenables.
export const isoCL = (ms: number) =>
  new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

// Clases del input de texto del admin, compartidas por los formularios del panel.
export const campoAdmin = "w-full bg-surface-container border border-outline/30 rounded-lg py-2 px-3";
