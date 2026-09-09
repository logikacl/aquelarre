"use client";
import { useState } from "react";
import { COPY_GROUPS, SECTION_LABELS, type CopyDef } from "@/lib/copy";
import { setContent } from "@/app/admin/actions";
import ImageField from "@/components/ImageField";
import { campoAdmin as campo } from "@/lib/format";

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

// Una pestaña por sección: el segundo segmento de la clave ("home.faq.1.pregunta" → "home.faq").
// Se arma una sola vez al cargar el módulo porque COPY_GROUPS es constante del código.
const TABS = COPY_GROUPS.flatMap((g) => {
  const secciones = new Map<string, CopyDef[]>();
  for (const item of g.items) {
    const id = `${g.page}.${item.key.split(".")[1]}`;
    secciones.set(id, [...(secciones.get(id) ?? []), item]);
  }
  return [...secciones].map(([id, items]) => ({
    id,
    page: g.page,
    pageLabel: g.label,
    label: SECTION_LABELS[id] ?? id.split(".")[1],
    items,
  }));
});

export default function ContentEditor({ overrides }: { overrides: Record<string, string> }) {
  const [activa, setActiva] = useState(TABS[0].id);

  // Se renderizan todas las secciones y se ocultan las inactivas: cambiar de pestaña
  // desmontando perdería lo escrito y no guardado, y son 69 inputs, no 6.900.
  return (
    <div className="space-y-6">
      <nav className="space-y-2">
        {COPY_GROUPS.map((g) => (
          <div key={g.page} className="flex flex-wrap items-center gap-2">
            <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-on-surface-variant">{g.label}</span>
            {TABS.filter((t) => t.page === g.page).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiva(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-headline font-semibold border transition-colors ${
                  activa === t.id
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline/30 text-on-surface-variant hover:text-primary"
                }`}
              >
                {t.label}
                <span className="ml-2 opacity-60">{t.items.length}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {TABS.map((t) => (
        <div key={t.id} hidden={t.id !== activa} className="space-y-3">
          <h3 className="text-lg font-headline font-bold border-b border-outline/30 pb-2">
            {t.pageLabel} — {t.label}
          </h3>
          {t.items.map((item) => (
            <Campo key={item.key} def={item} override={overrides[item.key]} />
          ))}
        </div>
      ))}
    </div>
  );
}
