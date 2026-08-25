// Markdown de la guía de aspectos → registros del corpus. Conversión mecánica:
// no reescribe ni resume, solo limpia markdown y las citas [12, 345] de NotebookLM.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(process.argv[2], "utf8");

const SIN_TILDE = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// "El equilibrio ... [145, 327]." → "El equilibrio ...".
const limpiar = (s) =>
  s.replace(/\s*\[[\d,\s]+\]/g, "").replace(/\s+/g, " ").trim();

const INTENSIDAD = { "media": 3, "alta-media": 4, "media-alta": 4, "alta": 5 };

const ASPECTO = (h) =>
  /conjunci/i.test(h) ? "conjuncion" : /arm[oó]nico/i.test(h) ? "armonico" : /tenso/i.test(h) ? "tenso" : null;

// El label del primer bullet aparece una vez en inglés (línea 469) — se acepta y normaliza.
const CAMPO = {
  "que se activa": "activa",
  "what is activated": "activa",
  "manifestacion tipica": "manifestacion",
  "consejo practico": "consejo",
};

const out = [];
let planeta = null, natal = null, rec = null;

const cerrar = () => { if (rec) out.push(rec); rec = null; };

for (const linea of src.split("\n")) {
  let m;
  if ((m = linea.match(/^## \*\*\d+\.\s*TRÁNSITOS DE (.+?)\*\*/))) {
    cerrar(); planeta = SIN_TILDE(m[1]); natal = null;
  } else if ((m = linea.match(/^### \*\*(\S+)\s+Natal/))) {
    cerrar(); natal = SIN_TILDE(m[1]);
  } else if ((m = linea.match(/^#### \*\*(.+?)\*\*/))) {
    cerrar();
    const aspecto = ASPECTO(m[1]);
    if (!aspecto) throw new Error(`aspecto desconocido: ${m[1]}`);
    rec = {
      categoria: "transito_aspecto",
      planeta, planetaNatal: natal, aspecto,
      fuente: "arroyo+greene+sasportas", version: 1,
    };
  } else if (rec && (m = linea.match(/^- \*\*(.+?)\*\*:\s*(.+)$/))) {
    const label = SIN_TILDE(m[1]);
    if (label === "intensidad") {
      const nivel = SIN_TILDE(limpiar(m[2]).replace(/\*\*/g, "").split("(")[0]).trim();
      const n = INTENSIDAD[nivel];
      if (!n) throw new Error(`intensidad desconocida: "${nivel}"`);
      rec.intensidad = n;
    } else {
      const campo = CAMPO[label];
      if (!campo) throw new Error(`campo desconocido: ${label}`);
      rec[campo] = limpiar(m[2]);
    }
  }
}
cerrar();

// Orden de claves estable y validación: nada a medio parsear.
const norm = out.map((r) => ({
  categoria: r.categoria, planeta: r.planeta, planetaNatal: r.planetaNatal,
  aspecto: r.aspecto, activa: r.activa, manifestacion: r.manifestacion,
  consejo: r.consejo, intensidad: r.intensidad, fuente: r.fuente, version: r.version,
}));

const faltan = norm.filter((r) =>
  !r.planeta || !r.planetaNatal || !r.activa || !r.manifestacion || !r.consejo || !r.intensidad);
if (faltan.length) throw new Error(`${faltan.length} registros incompletos`);

const claves = new Set(norm.map((r) => `${r.planeta}|${r.planetaNatal}|${r.aspecto}`));
if (claves.size !== norm.length) throw new Error("claves duplicadas");

writeFileSync(process.argv[3], JSON.stringify(norm, null, 1) + "\n");
console.log(`${norm.length} registros`);
console.log("transitantes:", [...new Set(norm.map((r) => r.planeta))].join(", "));
console.log("natales:", [...new Set(norm.map((r) => r.planetaNatal))].join(", "));
console.log("aspectos:", [...new Set(norm.map((r) => r.aspecto))].join(", "));
