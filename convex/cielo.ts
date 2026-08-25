// Cruza el cielo calculado (astro.ts) con el corpus de interpretaciones y arma el
// bloque de texto que se le adjunta al system prompt del oráculo.
//
// Solo usa las tres categorías que NO dependen de la carta natal: son cielo
// compartido, iguales para todo consultante, así que funcionan aunque la persona
// no haya dado hora de nacimiento. `transito_casa` y `transito_aspecto` esperan a
// que astro.ts calcule casas y longitudes natales en grados.
//
// El lookup es un índice determinista, no búsqueda semántica: sin embeddings.
import { cieloDeHoy, type Cielo } from "./astro";
import fasesCorpus from "./corpus/fase_lunar.json";
import signosCorpus from "./corpus/planeta_signo.json";
import retrosCorpus from "./corpus/retrogrado.json";

// De cada registro se toma un solo campo, el más útil para una consulta personal:
// la fase aporta qué momento del ciclo es (`energia`), el planeta en signo aporta
// cómo se vive (`personal`, no el marco social de `temaColectivo`), y el retrógrado
// aporta qué se está revisando (`revisa`). Los `consejo`/`accion` del corpus quedan
// fuera a propósito: el consejo lo da el oráculo con su voz, no recitando el corpus.
// ponytail: un campo por categoría. Si al oráculo le falta material, sumar aquí.
const fase = (f: string, signo: string) =>
  fasesCorpus.find((r) => r.faseLunar === f && r.signo === signo)?.energia;
const enSigno = (planeta: string, signo: string) =>
  signosCorpus.find((r) => r.planeta === planeta && r.signo === signo)?.personal;
const retro = (planeta: string) =>
  retrosCorpus.find((r) => r.planeta === planeta)?.revisa;

const NOMBRE: Record<string, string> = {
  mercurio: "Mercurio", venus: "Venus", marte: "Marte", jupiter: "Júpiter",
  saturno: "Saturno", urano: "Urano", neptuno: "Neptuno", pluton: "Plutón",
};

const NOMBRE_FASE: Record<string, string> = {
  nueva: "Luna nueva", creciente_inicial: "Luna creciente",
  cuarto_creciente: "Cuarto creciente", creciente_gibosa: "Luna gibosa creciente",
  llena: "Luna llena", menguante_gibosa: "Luna gibosa menguante",
  cuarto_menguante: "Cuarto menguante", menguante_final: "Luna balsámica",
};

// Bloque para el system prompt. Devuelve "" si por alguna razón no hay nada que decir,
// para que el prompt quede igual que antes en vez de con un encabezado huérfano.
export function bloqueCielo(cielo: Cielo = cieloDeHoy()): string {
  const lineas: string[] = [];

  const luna = fase(cielo.fase, cielo.lunaSigno);
  if (luna) lineas.push(`- ${NOMBRE_FASE[cielo.fase]} en ${cielo.lunaSigno}: ${luna}`);

  for (const { planeta, signo } of cielo.lentos) {
    const texto = enSigno(planeta, signo);
    if (texto) lineas.push(`- ${NOMBRE[planeta]} en ${signo}: ${texto}`);
  }

  for (const planeta of cielo.retrogrados) {
    const texto = retro(planeta);
    if (texto) lineas.push(`- ${NOMBRE[planeta]} retrógrado: ${texto}`);
  }

  if (!lineas.length) return "";
  return [
    "Cielo de hoy (contexto colectivo: le toca igual a todo el mundo, no es la carta de esta persona).",
    "Es trasfondo para tu lectura — úsalo si viene al caso, nunca lo recites ni lo enumeres:",
    ...lineas,
  ].join("\n");
}
