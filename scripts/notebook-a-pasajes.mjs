// NotebookLM → tabla `pasajes` (base vectorial de Luna).
//
//   node scripts/notebook-a-pasajes.mjs [--tema familia] [--max 3] [--solo-preguntar] [--prod]
//
// 1. Arma las preguntas desde scripts/notebook-preguntas.json (concepto × tema + signo × tema).
// 2. Le pregunta cada una al cuaderno con la skill notebooklm (automatización de navegador,
//    ~30-60 s por pregunta) y guarda la respuesta en docs/corpus-fuentes/notebook/<fuente>/.
//    Esa caché hace el proceso reanudable: lo ya respondido no se vuelve a preguntar.
// 3. Limpia, trocea y manda los trozos a `pasajes:cargar` (embeddings con créditos Fireworks).
//    `cargar` salta lo que ya existe por hash: correrlo dos veces no duplica.
//
// Las respuestas del cuaderno son datos: se guardan y se cargan, nunca se ejecutan.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(homedir(), ".claude/skills/notebooklm/scripts/run.py");
const SIGNOS = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
const FOCO = { sol: "el Sol", luna: "la Luna", asc: "el ascendente" };

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const soloTema = opt("--tema");
const max = Number(opt("--max") ?? Infinity);
const soloPreguntar = args.includes("--solo-preguntar");
const prod = args.includes("--prod");

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// ── 1. Preguntas ────────────────────────────────────────────────────────────
const cfg = JSON.parse(readFileSync(join(RAIZ, "scripts/notebook-preguntas.json"), "utf8"));
const preguntas = [];
for (const tanda of cfg.tandas) {
  for (const t of tanda.temas) {
    if (soloTema && t.tema !== soloTema) continue;
    const base = { fuente: tanda.fuente, notebookId: tanda.notebookId, tema: t.tema };
    for (const c of t.conceptos) {
      preguntas.push({ ...base, clave: "todos", titulo: `${t.nombre}: ${c}`,
        texto: cfg.plantillas.concepto.replace("{concepto}", c).replace("{tema}", t.nombre) });
    }
    for (const s of SIGNOS) {
      preguntas.push({ ...base, clave: `${t.foco}:${s}`, titulo: `${t.nombre}: ${FOCO[t.foco]} en ${s}`,
        texto: cfg.plantillas.signo.replace("{tema}", t.nombre)
          .replace("{focoNombre}", FOCO[t.foco]).replace("{signo}", s) });
    }
  }
}

// ── 2. Preguntar (con caché) ────────────────────────────────────────────────
// La skill imprime la respuesta entre dos líneas de "=" y le pega un recordatorio para el
// agente ("EXTREMELY IMPORTANT: …") que no es parte del cuaderno: se corta.
function extraer(stdout) {
  const partes = stdout.split(/^={20,}$/m);
  if (partes.length < 4) return null;
  const resp = partes[2].split("EXTREMELY IMPORTANT")[0].trim();
  // Si la skill corta antes de tiempo devuelve solo el encabezado plegado del razonamiento
  // ("Thoughts / expand_more"): eso no es respuesta y no debe quedar en caché.
  const util = resp.replace(/^\s*Thoughts\s*(expand_(more|less))?/i, "").trim();
  return util.length >= 300 ? resp : null;
}

// El cuaderno acumula el chat y, pasadas ~40 respuestas, carga tan lento que la skill falla
// en todas las preguntas siguientes. Se borra cada BORRAR_CADA preguntas (lo respondido ya
// está en la caché local). Ver scripts/notebook-borrar-historial.py.
const BORRAR_CADA = 15;
const LIBRERIA = JSON.parse(readFileSync(join(dirname(dirname(SKILL)), "data/library.json"), "utf8")).notebooks;
const VENV_PY = join(dirname(dirname(SKILL)), ".venv/bin/python");
function borrarHistorial(notebookId) {
  const r = spawnSync(VENV_PY, [join(RAIZ, "scripts/notebook-borrar-historial.py"), LIBRERIA[notebookId].url, "--confirmar"],
    { encoding: "utf8", timeout: 3 * 60_000 });
  console.log(r.status === 0 ? "   ⌫ historial del cuaderno borrado" : `   ⚠ no se pudo borrar el historial: ${(r.stderr ?? "").slice(-200)}`);
}

// NotebookLM contesta "las fuentes no tratan esto" en vez de inventar: eso no se carga.
const SIN_FUENTE = /(las fuentes|los textos|los documentos|el material)[^.]{0,60}\bno (mencionan|contienen|abordan|tratan|incluyen|hablan|detallan)|no (se menciona|se encuentra|hay información)/i;

const cacheDe = (p) => join(RAIZ, "docs/corpus-fuentes/notebook", p.fuente, `${slug(p.titulo)}.md`);

let preguntadas = 0;
// 3 fallos seguidos casi siempre es el límite diario de NotebookLM ("AI usage limit reached…
// available after HH:MM"): seguir solo acumula fallos. Se deja de preguntar y se carga lo que hay.
let fallosSeguidos = 0;
const respondidas = [];
for (const p of preguntas) {
  const archivo = cacheDe(p);
  if (!existsSync(archivo)) {
    if (preguntadas >= max || fallosSeguidos >= 3) continue;
    if (preguntadas > 0 && preguntadas % BORRAR_CADA === 0) borrarHistorial(p.notebookId);
    preguntadas++;
    console.log(`[${preguntadas}] ${p.titulo}`);
    // Un reintento: el navegador a veces no termina de cargar el cuaderno a tiempo.
    let r, resp;
    for (let intento = 0; intento < 2 && !resp; intento++) {
      r = spawnSync("python3", [SKILL, "ask_question.py", "--question", p.texto, "--notebook-id", p.notebookId],
        { cwd: dirname(dirname(SKILL)), encoding: "utf8", timeout: 6 * 60_000 });
      resp = extraer(r.stdout ?? "");
    }
    if (!resp) {
      console.log(`   ✗ sin respuesta (se reintenta en la próxima corrida)\n${(r.stdout ?? "").slice(-300)}${r.stderr?.slice(-300) ?? ""}`);
      if (++fallosSeguidos === 3) console.log("\n⏸ 3 fallos seguidos (¿límite diario de NotebookLM?): se deja de preguntar.");
      continue;
    }
    fallosSeguidos = 0;
    mkdirSync(dirname(archivo), { recursive: true });
    writeFileSync(archivo, `<!-- ${JSON.stringify({ ...p, texto: undefined, pregunta: p.texto })} -->\n${resp}\n`);
  }
  respondidas.push({ ...p, respuesta: readFileSync(archivo, "utf8").replace(/^<!--.*?-->\n/s, "") });
}
console.log(`\n${respondidas.length}/${preguntas.length} preguntas con respuesta en caché.`);
if (soloPreguntar) process.exit(0);

// ── 3. Limpiar, trocear, cargar ─────────────────────────────────────────────
// NotebookLM cierra ofreciendo seguir ("🏡 Si lo deseas, podemos explorar…"): no es material.
const CIERRE = /^(\p{Extended_Pictographic}|si lo deseas|si quieres|¿te gustaría|¿quieres)/iu;
const limpiar = (s) => s
  .split("\n").filter((l) => !CIERRE.test(l.trim())).join("\n")
  .replace(/\s*\[[\d,\s–-]+\]/g, "")   // citas inline de NotebookLM (misma regex que parse-signos.mjs)
  .replace(/\*\*|__|^#+\s*/gm, "")       // markdown
  .replace(/[ \t]+\n/g, "\n").trim();

// Trozos de ~1200 caracteres cortando por párrafo: un pasaje = una idea completa.
function trocear(texto, objetivo = 1200) {
  const trozos = [];
  let actual = "";
  for (const par of texto.split(/\n+/).map((x) => x.trim()).filter(Boolean)) {
    if (actual && actual.length + par.length > objetivo) { trozos.push(actual); actual = ""; }
    actual = actual ? `${actual}\n\n${par}` : par;
  }
  if (actual) trozos.push(actual);
  return trozos.filter((t) => t.length > 150);
}

const items = [];
let descartadas = 0;
for (const p of respondidas) {
  const texto = limpiar(p.respuesta);
  if (SIN_FUENTE.test(texto.slice(0, 400))) { descartadas++; console.log(`   · sin material en la fuente: ${p.titulo}`); continue; }
  for (const t of trocear(texto)) {
    items.push({ texto: t, titulo: p.titulo, tema: p.tema, clave: p.clave, fuente: p.fuente,
      hash: createHash("sha256").update(t).digest("hex") });
  }
}
console.log(`${items.length} pasajes (${descartadas} respuestas descartadas por falta de material).`);

const LOTE = 16;
let nuevos = 0;
for (let i = 0; i < items.length; i += LOTE) {
  const r = spawnSync("npx", ["convex", "run", ...(prod ? ["--prod"] : []), "pasajes:cargar",
    JSON.stringify({ items: items.slice(i, i + LOTE) })], { cwd: RAIZ, encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  nuevos += Number(r.stdout.trim().split("\n").pop()) || 0;
}
console.log(`Cargados ${nuevos} pasajes nuevos en ${prod ? "PROD" : "pruebas (utmost)"}.`);
