// Documentos de la capa "planeta en signo" → registros del corpus.
// Conversión mecánica: no reescribe ni resume. Limpia los restos de las citas de
// NotebookLM (lineas con un solo ".", continuaciones que arrancan con coma, y los
// corchetes [302, 330] cuando vienen inline).
//
// Dos documentos, dos maquetados, mismos tres campos de fondo. El perfil se elige
// olfateando el texto; la maquinaria de acumular lineas es comun.
//
//   lentos — Jupiter y Saturno, "Etiqueta: valor" en texto plano, signo en linea sola.
//            Solo esos dos vienen desglosados: la seccion III explica que Urano,
//            Neptuno y Pluton pasan anios en cada signo, asi que su posicion por
//            signo es generacional y —segun Arroyo— dice muy poco del individuo.
//            Esa seccion es prosa con dos ejemplos sueltos, no una grilla: se ignora.
//   luna   — solo la Luna, bullets markdown, signo en encabezado "## N. Signo".
//
// ponytail: un `if` por perfil en vez de dos scripts. Si aparece un tercer maquetado
// muy distinto, ahi si conviene separarlos.
import { readFileSync, writeFileSync } from "node:fs";

// Mismas cadenas que SIGNOS en convex/astro.ts, para que la clave calce con signo().
const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const PERFILES = {
  lentos: {
    fuente: "arroyo+greene",
    // "Cómo se vive a personal" (sin "nivel") aparece una vez — se acepta y normaliza.
    campos: [
      [/^Tema colectivo:/, "temaColectivo"],
      [/^Cómo se vive a (nivel )?personal:/, "personal"],
      [/^Duración aproximada:/, "duracion"],
      [/^Consejo práctico:/, "consejo"],
    ],
  },
  // Los cinco lentos en markdown: planeta en "## 1. Júpiter", signo en "### **Aries**".
  // El preambulo declara que solo Jupiter y Saturno estan detallados en las obras; los
  // tres transpersonales se formularon aplicando los principios de cada planeta a las
  // cualidades de cada signo. Es extrapolacion, no cita, y queda marcado en `fuente`.
  lentosMd: {
    fuente: (planeta) =>
      ["jupiter", "saturno"].includes(planeta)
        ? "arroyo+greene+sasportas"
        : "arroyo+greene+sasportas (extrapolado de los principios del planeta por signo)",
    planetaRe: /^##\s*\d+\.\s*(\S+)\s*$/,
    signoRe: /^###\s*\*\*(\S+?)\*\*\s*$/,
    campos: [
      [/^-\s*\*\*Tema colectivo:?\*\*:?/, "temaColectivo"],
      [/^-\s*\*\*Cómo se vive a nivel personal:?\*\*:?/, "personal"],
      [/^-\s*\*\*Duración aproximada:?\*\*:?/, "duracion"],
      [/^-\s*\*\*Consejo práctico:?\*\*:?/, "consejo"],
    ],
  },
  luna: {
    fuente: "arroyo+sasportas",
    planeta: "luna",
    // El documento no declara duracion; el paso de la Luna por un signo es dato
    // astronomico, no contenido de autor.
    duracion: "2 días y medio",
    // "Tono emocional" ocupa el lugar de "cómo se vive a nivel personal": es el mismo
    // rol —la vivencia interna— con el vocabulario propio de la Luna.
    campos: [
      [/^-\s*Energía general de la fase:/, "temaColectivo"],
      [/^-\s*Tono emocional:/, "personal"],
      [/^-\s*Acción sugerida:/, "consejo"],
    ],
  },
};

const limpiar = (partes) =>
  partes.join(" ")
    .replace(/\s*\[[\d,\s]+\]/g, "")  // citas inline de NotebookLM
    .replace(/\s+([,.;])/g, "$1")     // " , asumiendo" → ", asumiendo"
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*$/, ".")
    .trim();

// Cada documento escribe el lapso a su manera: "Estimación típica: 1 año.",
// "2 años y medio", "Aproximadamente 7 años por signo". Se deja solo el lapso.
const limpiarDuracion = (s) =>
  s.replace(/^Estimación típica:\s*/i, "")
    .replace(/^Aproximadamente\s+/i, "")
    .replace(/\s+por signo$/i, "")
    .replace(/\.$/, "")
    .trim();

const texto = readFileSync(process.argv[2], "utf8");
const perfil = /Luna \[Tránsito\]/.test(texto) ? PERFILES.luna
  : /^##\s*\d+\.\s*(Júpiter|Saturno|Urano|Neptuno|Plutón)\s*$/m.test(texto) ? PERFILES.lentosMd
  : PERFILES.lentos;

const sinTilde = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fuenteDe = (planeta) =>
  typeof perfil.fuente === "function" ? perfil.fuente(planeta) : perfil.fuente;

const out = [];
let planeta = perfil.planeta ?? null, rec = null, campo = null, buf = [];

const cerrarCampo = () => {
  if (rec && campo) rec[campo] = campo === "duracion" ? limpiarDuracion(limpiar(buf)) : limpiar(buf);
  campo = null; buf = [];
};
const cerrarRec = () => { cerrarCampo(); if (rec) out.push(rec); rec = null; };

const abrirRec = (signo) => {
  cerrarRec();
  rec = { categoria: "planeta_signo", planeta, signo, fuente: fuenteDe(planeta), version: 1 };
  if (perfil.duracion) rec.duracion = perfil.duracion;
};

for (const cruda of texto.split("\n")) {
  const linea = cruda.trim();
  if (!linea || linea === ".") continue;
  if (/^-{3,}$/.test(linea)) { cerrarCampo(); continue; } // separador markdown, no contenido

  let m;
  if ((m = linea.match(/^I+\.\s+TRÁNSITOS DE (\S+)/))) {
    cerrarRec();
    planeta = sinTilde(m[1]);
    continue;
  }
  if (/^III\./.test(linea)) { cerrarRec(); planeta = null; continue; } // seccion sin grilla
  // planeta como encabezado "## 3. Urano" (lentosMd)
  if (perfil.planetaRe && (m = linea.match(perfil.planetaRe)) && !SIGNOS.includes(m[1])) {
    cerrarRec();
    planeta = sinTilde(m[1]);
    continue;
  }
  if (!planeta) continue;

  // signo como linea suelta (lentos), "## 4. Cáncer" (luna) o "### **Aries**" (lentosMd)
  if (SIGNOS.includes(linea)) { abrirRec(linea); continue; }
  if ((m = linea.match(/^##\s*\d+\.\s*(\S+)$/)) && SIGNOS.includes(m[1])) { abrirRec(m[1]); continue; }
  if (perfil.signoRe && (m = linea.match(perfil.signoRe)) && SIGNOS.includes(m[1])) { abrirRec(m[1]); continue; }

  const hit = perfil.campos.find(([re]) => re.test(linea));
  if (hit) {
    cerrarCampo();
    campo = hit[1];
    buf = [linea.replace(hit[0], "").trim()];
  } else if (campo) {
    buf.push(linea); // continuacion del campo anterior
  }
}
cerrarRec();

const norm = out.map((r) => ({
  categoria: r.categoria, planeta: r.planeta, signo: r.signo,
  temaColectivo: r.temaColectivo, personal: r.personal, consejo: r.consejo,
  duracion: r.duracion, fuente: r.fuente, version: r.version,
}));

const incompletos = norm.filter((r) =>
  !r.temaColectivo || !r.personal || !r.consejo || !r.duracion);
if (incompletos.length) throw new Error(`${incompletos.length} registros incompletos`);

for (const p of new Set(norm.map((r) => r.planeta))) {
  const suyos = norm.filter((r) => r.planeta === p).map((r) => r.signo);
  const faltan = SIGNOS.filter((s) => !suyos.includes(s));
  if (faltan.length) throw new Error(`${p}: faltan ${faltan.join(", ")}`);
  if (suyos.length !== 12) throw new Error(`${p}: ${suyos.length} signos`);
}

writeFileSync(process.argv[3], JSON.stringify(norm, null, 1) + "\n");
console.log(`${norm.length} registros`);
for (const p of new Set(norm.map((r) => r.planeta)))
  console.log(` ${p}: 12 signos · duracion "${norm.find((r) => r.planeta === p).duracion}"`);
