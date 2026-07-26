"use client";
import { useState } from "react";
import { COPY_GROUPS, type CopyDef } from "@/lib/copy";
import { setContent } from "@/app/admin/actions";
import ImageField from "@/components/ImageField";

const campo = "w-full bg-surface-container border border-outline/30 rounded-lg py-2 px-3";

// ponytail: se guarda campo por campo, sin "guardar todo" ni autosave. Cada guardado es
// un round-trip al backend + revalidación de las páginas públicas; con 69 campos un
// "guardar todo" serían 69 llamadas. Vale la pena un endpoint bulk solo si el cliente
// empieza a editar tandas grandes de una sentada.
function Campo({ def, override }: { def: CopyDef; override?: string }) {
  const [valor, setValor] = useState(override ?? def.def);
  const [sobrescrito, setSobrescrito] = useState(override !== undefined);
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok">("idle");
  const [error, setError] = useState("");

  // nuevo = "" es el mecanismo de restaurar: el backend borra la fila y vuelve el default.
  async function enviar(nuevo: string) {
    setEstado("guardando");
    setError("");
    try {
      const r = await setContent(def.key, nuevo);
      if (r?.error) {
        setError(r.error);
        setEstado("idle");
        return;
      }
      const vacio = !nuevo.trim();
      setValor(vacio ? def.def : nuevo);
      setSobrescrito(!vacio);
      setEstado("ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : "error desconocido");
      setEstado("idle");
    }
  }

  // Al editar se limpia la confirmación anterior para no mostrar "Guardado" sobre un cambio sin guardar.
  const editar = (v: string) => {
    setValor(v);
    setEstado("idle");
    setError("");
  };

  const ocupado = estado === "guardando";

  return (
    <div
      className={`rounded-xl border p-4 space-y-2 ${
        sobrescrito ? "border-primary/50 bg-primary/5" : "border-outline/20"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-on-surface">{def.label}</p>
          <p className="text-xs text-on-surface-variant break-all">{def.key}</p>
        </div>
        {sobrescrito && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">Editado</span>
        )}
      </div>

      {def.kind === "image" ? (
        <ImageField label="Subir imagen" value={valor} onChange={editar} />
      ) : def.kind === "long" ? (
        <textarea value={valor} onChange={(e) => editar(e.target.value)} rows={3} className={campo} />
      ) : (
        <input value={valor} onChange={(e) => editar(e.target.value)} className={campo} />
      )}

      {/* Se mira también el default: la advertencia tiene que seguir ahí justo cuando alguien borra el placeholder. */}
      {def.def.includes("{nombre}") &&
        (valor.includes("{nombre}") ? (
          <p className="text-xs text-on-surface-variant">
            {"{nombre}"} se reemplaza por el nombre del oráculo al mostrar la página: consérvalo tal cual.
          </p>
        ) : (
          <p className="text-xs text-error">
            Falta {"{nombre}"}, que se reemplaza por el nombre del oráculo. Sin él el texto queda igual para todos.
          </p>
        ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => enviar(valor)}
          disabled={ocupado}
          className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-bold disabled:opacity-40"
        >
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
        {sobrescrito && (
          <button
            onClick={() => enviar("")}
            disabled={ocupado}
            className="px-4 py-1.5 rounded-lg border border-outline/40 text-sm disabled:opacity-40"
          >
            Restaurar default
          </button>
        )}
        {estado === "ok" && <span className="text-sm text-on-surface-variant">Guardado.</span>}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    </div>
  );
}

export default function ContentEditor({ overrides }: { overrides: Record<string, string> }) {
  return (
    <div className="space-y-10">
      {COPY_GROUPS.map((g) => (
        <div key={g.page} className="space-y-3">
          <h3 className="text-lg font-headline font-bold border-b border-outline/30 pb-2">{g.label}</h3>
          {g.items.map((item) => (
            <Campo key={item.key} def={item} override={overrides[item.key]} />
          ))}
        </div>
      ))}
    </div>
  );
}
