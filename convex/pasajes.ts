// Base vectorial de Luna: carga y búsqueda de pasajes de interpretación.
// Embeddings con Fireworks (misma cuenta y clave que el chat: no suma proveedor ni una
// transferencia internacional nueva). Búsqueda con el vector search nativo de Convex.
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const EMBED_URL = "https://api.fireworks.ai/inference/v1/embeddings";
// Qwen3 embedding: multilingüe, acepta `dimensions` (Matryoshka). Convex admite hasta 2048.
const DEFAULT_EMBED_MODEL = "fireworks/qwen3-embedding-8b";
const DIMENSIONES = 1024; // = dimensions del vectorIndex en schema.ts
// Qwen3 rinde mejor si la consulta (no los documentos) lleva la instrucción de la tarea.
const INSTRUCCION = "Instruct: Dada la consulta de una persona a su astróloga, recupera pasajes de interpretación astrológica que traten su tema\nQuery: ";
// ponytail: umbral fijo calibrado a ojo con las primeras pruebas. Si trae ruido, subirlo;
// si casi nunca trae nada, bajarlo.
const UMBRAL = 0.45;
const TOP = 3;

async function embed(textos: string[]): Promise<number[][]> {
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.FIREWORKS_API}` },
    body: JSON.stringify({
      model: process.env.FIREWORKS_EMBED_MODEL ?? DEFAULT_EMBED_MODEL,
      input: textos,
      dimensions: DIMENSIONES,
    }),
  });
  if (!res.ok) throw new Error(`Fireworks embeddings ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return [...data.data].sort((a: any, b: any) => a.index - b.index).map((d: any) => d.embedding);
}

const item = v.object({
  texto: v.string(), titulo: v.string(), tema: v.string(),
  clave: v.string(), fuente: v.string(), hash: v.string(),
});

export const hashesExistentes = internalQuery({
  args: { hashes: v.array(v.string()) },
  handler: async (ctx, { hashes }) => {
    const hay: string[] = [];
    for (const hash of hashes) {
      if (await ctx.db.query("pasajes").withIndex("by_hash", (q) => q.eq("hash", hash)).first()) hay.push(hash);
    }
    return hay;
  },
});

export const insertar = internalMutation({
  args: { filas: v.array(v.object({ ...item.fields, embedding: v.array(v.float64()) })) },
  handler: async (ctx, { filas }) => {
    for (const f of filas) await ctx.db.insert("pasajes", f);
  },
});

// Lo llama scripts/notebook-a-pasajes.mjs por lotes. Devuelve cuántos pasajes eran nuevos.
export const cargar = internalAction({
  args: { items: v.array(item) },
  handler: async (ctx, { items }) => {
    const hay = new Set(await ctx.runQuery(internal.pasajes.hashesExistentes, { hashes: items.map((i) => i.hash) }));
    const nuevos = items.filter((i) => !hay.has(i.hash));
    if (!nuevos.length) return 0;
    // El título va al embedding: "la familia…: la Luna en Aries" ancla el tema aunque el
    // trozo no lo nombre.
    const vectores = await embed(nuevos.map((i) => `${i.titulo}\n\n${i.texto}`));
    await ctx.runMutation(internal.pasajes.insertar, {
      filas: nuevos.map((i, k) => ({ ...i, embedding: vectores[k] })),
    });
    return nuevos.length;
  },
});

// Para recargar una fuente desde cero (p.ej. tras cambiar cómo se trocea):
// npx convex run pasajes:borrarFuente '{"fuente":"sasportas-arroyo-greene"}'
export const borrarFuente = internalMutation({
  args: { fuente: v.string() },
  handler: async (ctx, { fuente }) => {
    const filas = (await ctx.db.query("pasajes").collect()).filter((p) => p.fuente === fuente);
    await Promise.all(filas.map((f) => ctx.db.delete(f._id)));
    return filas.length;
  },
});

export const porIds = internalQuery({
  args: { ids: v.array(v.id("pasajes")) },
  handler: async (ctx, { ids }) => (await Promise.all(ids.map((id) => ctx.db.get(id)))).filter((d) => d !== null),
});

type Carta = { sun?: string; moon?: string; asc?: string } | undefined;

// Pasajes para un mensaje: los genéricos más los del Sol, Luna y Ascendente de esta persona.
export async function buscarPasajes(ctx: ActionCtx, consulta: string, carta: Carta) {
  const [vector] = await embed([INSTRUCCION + consulta]);
  const claves = ["todos",
    carta?.sun && `sol:${carta.sun}`, carta?.moon && `luna:${carta.moon}`, carta?.asc && `asc:${carta.asc}`,
  ].filter((c): c is string => Boolean(c));
  const hits = await ctx.vectorSearch("pasajes", "by_embedding", {
    vector,
    limit: TOP * 4, // holgura para quedarse con uno por respuesta
    filter: (q) => q.or(...claves.map((c) => q.eq("clave", c))),
  });
  const buenos = hits.filter((h) => h._score >= UMBRAL);
  const docs: Doc<"pasajes">[] = await ctx.runQuery(internal.pasajes.porIds, { ids: buenos.map((h) => h._id) });
  const score = new Map(buenos.map((h) => [h._id, h._score]));
  // Los trozos de una misma respuesta se parecen entre sí y coparían los 3 lugares: se toma
  // el mejor de cada respuesta (titulo) para que Luna reciba ángulos distintos.
  const vistos = new Set<string>();
  return docs
    .map((d) => ({ ...d, score: score.get(d._id)! }))
    .sort((a, b) => b.score - a.score)
    .filter((d) => !vistos.has(d.titulo) && vistos.add(d.titulo))
    .slice(0, TOP);
}

// Bloque para el system prompt ("" si no hay nada que pase el umbral).
export function bloquePasajes(pasajes: { titulo: string; texto: string }[]): string {
  if (!pasajes.length) return "";
  return [
    "Material de interpretación de los libros de referencia, elegido por lo que la persona está contando.",
    "Es trasfondo: tómalo para enriquecer tu lectura con tu propia voz, nunca lo recites ni lo cites:",
    ...pasajes.map((p) => `- (${p.titulo}) ${p.texto.replace(/\s*\n+\s*/g, " ")}`),
  ].join("\n");
}

// Para probar desde la CLI: npx convex run pasajes:buscar '{"texto":"…","sun":"Aries"}'
export const buscar = internalAction({
  args: { texto: v.string(), sun: v.optional(v.string()), moon: v.optional(v.string()), asc: v.optional(v.string()) },
  handler: async (ctx, { texto, ...carta }) =>
    (await buscarPasajes(ctx, texto, carta)).map((p) => ({ score: p.score.toFixed(3), titulo: p.titulo, texto: p.texto.slice(0, 160) })),
});
