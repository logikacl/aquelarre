// Guía de fases lunares por signo → registros del corpus. Conversión mecánica.
//
// Categoria 4 de la boveda: 8 fases × 12 signos = 96. Las claves de `faseLunar` son las
// que la boveda declara para `calcularFaseLunar` de la Capa 2, para que el mapeo desde
// el calculo sea directo y sin tabla de traduccion.
import { readFileSync, writeFileSync } from "node:fs";

// Mismas cadenas que SIGNOS en convex/astro.ts.
const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

// Titulo tal como aparece en el documento → clave tecnica de la Capa 2.
const FASES = {
  "Luna Nueva": "nueva",
  "Luna Creciente (inicial)": "creciente_inicial",
  "Cuarto Creciente": "cuarto_creciente",
  "Luna Gibosa Creciente": "creciente_gibosa",
  "Luna Llena": "llena",
  "Luna Gibosa Menguante": "menguante_gibosa",
  "Cuarto Menguante": "cuarto_menguante",
  "Luna Balsámica (menguante final)": "menguante_final",
};

const CAMPO = [
  [/^-\s*\*\*Energía general de la fase:?\*\*:?/, "energia"],
  [/^-\s*\*\*Tono emocional:?\*\*:?/, "tono"],
  [/^-\s*\*\*Acción sugerida:?\*\*:?/, "accion"],
];

const limpiar = (partes) =>
  partes.join(" ")
    .replace(/\s*\[[\d,\s]+\]/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const out = [];
let signo = null, rec = null, campo = null, buf = [];

const cerrarCampo = () => { if (rec && campo) rec[campo] = limpiar(buf); campo = null; buf = []; };
const cerrarRec = () => { cerrarCampo(); if (rec) out.push(rec); rec = null; };

for (const cruda of readFileSync(process.argv[2], "utf8").split("\n")) {
  const linea = cruda.trim();
  if (!linea || /^-{3,}$/.test(linea)) { cerrarCampo(); continue; }

  let m;
  if ((m = linea.match(/^##\s+(\S+)\s*$/)) && SIGNOS.includes(m[1])) {
    cerrarRec();
    signo = m[1];
    continue;
  }
  // "### **Luna Gibosa Menguante en Escorpio**"
  if ((m = linea.match(/^###\s*\*\*(.+?)\s+en\s+(\S+?)\*\*\s*$/))) {
    cerrarRec();
    const faseLunar = FASES[m[1]];
    if (!faseLunar) throw new Error(`fase desconocida: ${m[1]}`);
    if (m[2] !== signo) throw new Error(`signo del título (${m[2]}) ≠ sección (${signo})`);
    rec = { categoria: "fase_lunar", faseLunar, signo, fuente: "arroyo+greene+sasportas+rudhyar", version: 1 };
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
  categoria: r.categoria, faseLunar: r.faseLunar, signo: r.signo,
  energia: r.energia, tono: r.tono, accion: r.accion,
  fuente: r.fuente, version: r.version,
}));

for (const r of norm) {
  const faltan = ["energia", "tono", "accion"].filter((c) => !r[c]);
  if (faltan.length) throw new Error(`${r.faseLunar}/${r.signo}: faltan ${faltan.join(", ")}`);
}
for (const f of Object.values(FASES))
  for (const s of SIGNOS)
    if (!norm.some((r) => r.faseLunar === f && r.signo === s)) throw new Error(`falta ${f}/${s}`);
if (new Set(norm.map((r) => r.faseLunar + "|" + r.signo)).size !== norm.length)
  throw new Error("claves duplicadas");

writeFileSync(process.argv[3], JSON.stringify(norm, null, 1) + "\n");
console.log(`${norm.length} registros · ${Object.keys(FASES).length} fases × ${SIGNOS.length} signos`);
