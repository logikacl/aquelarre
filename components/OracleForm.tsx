"use client";
import { useState } from "react";
import { upsertOracle, deleteOracle } from "@/app/admin/actions";
import ImageField from "@/components/ImageField";
import { campoAdmin as campo } from "@/lib/format";

export type Oracle = {
  slug: string;
  name: string;
  system: string;
  specialty?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  published: boolean;
  order: number;
};

export default function OracleForm({ oracle }: { oracle?: Oracle }) {
  // Precarga TODOS los campos que el upsert manda: el botón Guardar envía el
  // estado completo, así que un campo sin precargar (system) borraba la personalidad.
  const [f, setF] = useState({
    slug: oracle?.slug ?? "",
    name: oracle?.name ?? "",
    system: oracle?.system ?? "",
    specialty: oracle?.specialty ?? "",
    bio: oracle?.bio ?? "",
    photoUrl: oracle?.photoUrl ?? "",
    published: oracle?.published ?? true,
    order: oracle?.order ?? 0,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // Sin router.refresh(): las acciones revalidan /admin como "layout", que ya cubre esta ruta.
  async function correr(fn: () => Promise<{ error: string } | void>) {
    setOcupado(true);
    setError("");
    try {
      const r = await fn();
      if (r?.error) setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error desconocido");
    } finally {
      setOcupado(false);
    }
  }

  const guardar = () => correr(() => upsertOracle(f));
  const borrar = () => {
    if (!oracle || !confirm("¿Borrar oráculo?")) return;
    correr(() => deleteOracle(oracle.slug));
  };

  return (
    <div className="space-y-3 border border-outline/20 rounded-xl p-4">
      <label className="block text-sm text-on-surface-variant">
        slug
        {/* De solo lectura al editar: cambiarlo crearía un duplicado en vez de renombrar. */}
        <input
          value={f.slug}
          readOnly={Boolean(oracle)}
          onChange={(e) => set("slug", e.target.value)}
          className={`${campo} mt-1 ${oracle ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </label>
      <label className="block text-sm text-on-surface-variant">
        Nombre
        <input value={f.name} onChange={(e) => set("name", e.target.value)} className={`${campo} mt-1`} />
      </label>
      <label className="block text-sm text-on-surface-variant">
        Especialidad
        <input value={f.specialty} onChange={(e) => set("specialty", e.target.value)} className={`${campo} mt-1`} />
      </label>
      <label className="block text-sm text-on-surface-variant">
        Bio (web)
        <textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={3} className={`${campo} mt-1`} />
      </label>
      <label className="block text-sm text-on-surface-variant">
        System prompt (chat)
        <textarea value={f.system} onChange={(e) => set("system", e.target.value)} rows={8} className={`${campo} mt-1`} />
      </label>
      <ImageField label="Foto" value={f.photoUrl} onChange={(url) => set("photoUrl", url)} />
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
          Publicado
        </label>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          Orden
          <input
            type="number"
            value={f.order}
            onChange={(e) => set("order", Number(e.target.value))}
            className="w-20 bg-surface-container border border-outline/30 rounded-lg py-2 px-3"
          />
        </label>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-3">
        <button onClick={guardar} disabled={ocupado}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-40">
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
        {oracle && (
          <button onClick={borrar} disabled={ocupado}
            className="px-5 py-2 rounded-lg border border-error/40 text-error disabled:opacity-40">
            Borrar
          </button>
        )}
      </div>
    </div>
  );
}
