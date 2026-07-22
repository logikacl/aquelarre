"use client";
import { useState } from "react";
import { upsertOracle, deleteOracle } from "@/app/admin/actions";

type Oracle = { slug: string; name: string; specialty?: string | null; bio?: string | null; photoUrl?: string | null };

export default function OracleForm({ oracle }: { oracle?: Oracle }) {
  const [f, setF] = useState({
    slug: oracle?.slug ?? "", name: oracle?.name ?? "", system: "",
    specialty: oracle?.specialty ?? "", bio: oracle?.bio ?? "", photoUrl: oracle?.photoUrl ?? "",
    published: true, order: 0,
  });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-3 border border-outline/20 rounded-xl p-4">
      <input placeholder="slug" value={f.slug} onChange={set("slug")} className="w-full border rounded p-2" />
      <input placeholder="Nombre" value={f.name} onChange={set("name")} className="w-full border rounded p-2" />
      <input placeholder="Especialidad" value={f.specialty} onChange={set("specialty")} className="w-full border rounded p-2" />
      <textarea placeholder="Bio (web)" value={f.bio} onChange={set("bio")} className="w-full border rounded p-2" />
      <textarea placeholder="System prompt (chat)" value={f.system} onChange={set("system")} className="w-full border rounded p-2" />
      <input placeholder="URL foto" value={f.photoUrl} onChange={set("photoUrl")} className="w-full border rounded p-2" />
      <div className="flex gap-3">
        <button onClick={() => upsertOracle({ ...f, published: Boolean(f.published), order: Number(f.order) })}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">Guardar</button>
        {oracle && (
          <button onClick={() => { if (confirm("¿Borrar oráculo?")) deleteOracle(oracle.slug); }}
            className="px-5 py-2 rounded-lg border border-error/40 text-error">Borrar</button>
        )}
      </div>
    </div>
  );
}
