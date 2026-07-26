"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertOracle, deleteOracle } from "@/app/admin/actions";
import ImageField from "@/components/ImageField";

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

const campo = "w-full bg-surface-container border border-outline/30 rounded-lg py-2 px-3";

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
  const router = useRouter();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  // Las acciones revalidan /admin; refrescar para que esta ruta vea los datos nuevos.
  const guardar = async () => {
    await upsertOracle(f);
    router.refresh();
  };
  const borrar = async () => {
    if (!oracle || !confirm("¿Borrar oráculo?")) return;
    await deleteOracle(oracle.slug);
    router.refresh();
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
      <div className="flex gap-3">
        <button onClick={guardar} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">
          Guardar
        </button>
        {oracle && (
          <button onClick={borrar} className="px-5 py-2 rounded-lg border border-error/40 text-error">
            Borrar
          </button>
        )}
      </div>
    </div>
  );
}
