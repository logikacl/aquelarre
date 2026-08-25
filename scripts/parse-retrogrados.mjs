// Guía de retrógrados → registros del corpus. Conversión mecánica, sin reescritura.
//
// El documento trae dos subsecciones por planeta ("Inicio del período" y "Durante el
// período") con campos distintos cada una. Se aplanan en un registro por planeta: la
// clave util es el planeta, y quien consulte decide si esta arrancando o en curso.
// Aplanar evita 14 registros con la mitad de los campos vacios.
//
// ponytail: parser propio en vez de generalizar parse-signos.mjs. Otra categoria, otra
// forma; unificarlos seria un mini-framework de configuracion para tres archivos.
import { readFileSync, writeFileSync } from "node:fs";

const PLANETAS = ["mercurio", "venus", "marte", "jupiter", "saturno", "urano", "neptuno", "pluton"];

// Los textos de origen analizan explicitamente solo los personales. Para los sociales y
// transpersonales el propio documento declara que aplico la "ley general de la
// retrogradacion" — es extrapolacion, no cita, y conviene que quede en el dato.
const EXPLICITOS = ["mercurio", "venus", "marte"];

const CAMPO = [
  [/^-\s*\*\*Qué anuncia:?\*\*:?/, "anuncia"],
  [/^-\s*\*\*Qué evitar:?\*\*:?/, "evitar"],
  [/^-\s*\*\*Qué se revisa en profundidad:?\*\*:?/, "revisa"],
  [/^-\s*\*\*Cómo se manifiesta:?\*\*:?/, "manifiesta"],
  [/^-\s*\*\*Consejo práctico:?\*\*:?/, "consejo"], // uno por fase: se resuelve con `fase`
];

const limpiar = (partes) =>
  partes.join(" ")
    .replace(/\s*\[[\d,\s]+\]/g, "")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const sinTilde = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const out = [];
let rec = null, fase = null, campo = null, buf = [];

const cerrarCampo = () => {
  if (rec && campo) {
    // "Consejo práctico" aparece en las dos fases: se desambigua por la subseccion.
    const clave = campo === "consejo" ? (fase === "inicio" ? "consejoInicio" : "consejoDurante") : campo;
    rec[clave] = limpiar(buf);
  }
  campo = null; buf = [];
};
const cerrarRec = () => { cerrarCampo(); if (rec) out.push(rec); rec = null; };

for (const cruda of readFileSync(process.argv[2], "utf8").split("\n")) {
  const linea = cruda.trim();
  if (!linea || /^-{3,}$/.test(linea)) { cerrarCampo(); continue; }

  let m;
  if ((m = linea.match(/^##\s*\d+\.\s*(\S+)\s+retrógrado/i))) {
    cerrarRec();
    const planeta = sinTilde(m[1]);
    if (!PLANETAS.includes(planeta)) throw new Error(`planeta inesperado: ${planeta}`);
    rec = {
      categoria: "retrogrado",
      planeta,
      fuente: EXPLICITOS.includes(planeta)
        ? "arroyo+greene+sasportas"
        : "arroyo+greene+sasportas (extrapolado de la ley general de retrogradación)",
      version: 1,
    };
    continue;
  }
  if (/^###/.test(linea)) {
    cerrarCampo();
    fase = /Inicio del período/i.test(linea) ? "inicio" : /Durante el período/i.test(linea) ? "durante" : null;
    if (!fase) throw new Error(`subsección desconocida: ${linea}`);
    continue;
  }
  if (!rec) continue;

  const hit = CAMPO.find(([re]) => re.test(linea));
  if (hit) {
    cerrarCampo();
    campo = hit[1];
    buf = [linea.replace(hit[0], "").trim()];
  } else if (campo) {
    buf.push(linea);
  }
}
cerrarRec();

const norm = out.map((r) => ({
  categoria: r.categoria, planeta: r.planeta,
  anuncia: r.anuncia, evitar: r.evitar, consejoInicio: r.consejoInicio,
  revisa: r.revisa, manifiesta: r.manifiesta, consejoDurante: r.consejoDurante,
  fuente: r.fuente, version: r.version,
}));

const OBLIGATORIOS = ["anuncia", "evitar", "consejoInicio", "revisa", "manifiesta", "consejoDurante"];
for (const r of norm) {
  const faltan = OBLIGATORIOS.filter((c) => !r[c]);
  if (faltan.length) throw new Error(`${r.planeta}: faltan ${faltan.join(", ")}`);
}
const faltanPlanetas = PLANETAS.filter((p) => !norm.some((r) => r.planeta === p));
if (faltanPlanetas.length) throw new Error(`faltan planetas: ${faltanPlanetas.join(", ")}`);
if (new Set(norm.map((r) => r.planeta)).size !== norm.length) throw new Error("planetas duplicados");

writeFileSync(process.argv[3], JSON.stringify(norm, null, 1) + "\n");
console.log(`${norm.length} registros: ${norm.map((r) => r.planeta).join(", ")}`);
console.log(`explícitos en las fuentes: ${EXPLICITOS.join(", ")} · extrapolados: ${PLANETAS.filter((p) => !EXPLICITOS.includes(p)).join(", ")}`);
