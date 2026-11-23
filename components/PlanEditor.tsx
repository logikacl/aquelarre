"use client";
import { useState } from "react";
import { upsertPlan, type PlanInput } from "@/app/admin/actions";
import { campoAdmin as campo } from "@/lib/format";

export type AdminPlan = PlanInput & { reveniuPlanId?: number };

const NUEVO: AdminPlan = { slug: "", name: "", priceClp: 6000, dailyLimit: 25, bullets: [], published: false, order: 0 };

// Un plan = una tarjeta. El slug no se edita una vez creado: es la clave que guardan las
// suscripciones; cambiarlo dejaría a sus suscriptores en el plan por defecto.
export default function PlanEditor({ plan, nuevo = false }: { plan?: AdminPlan; nuevo?: boolean }) {
  const [p, setP] = useState<AdminPlan>(plan ?? NUEVO);
  const [bullets, setBullets] = useState((plan ?? NUEVO).bullets.join("\n"));
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok">("idle");
  const [error, setError] = useState("");

  const set = <K extends keyof AdminPlan>(k: K, v: AdminPlan[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setEstado("idle");
  };

  async function guardar() {
    setEstado("guardando");
    setError("");
    try {
      const r = await upsertPlan({
        slug: p.slug.trim(),
        name: p.name.trim(),
        priceClp: p.priceClp,
        dailyLimit: p.dailyLimit,
        bullets: bullets.split("\n").map((b) => b.trim()).filter(Boolean),
        published: p.published,
        order: p.order,
      });
      if (r?.error) {
        setError(r.error);
        setEstado("idle");
        return;
      }
      setEstado("ok");
      if (nuevo) {
        setP(NUEVO);
        setBullets("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "error desconocido");
      setEstado("idle");
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-outline-variant bg-surface-container p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nombre (se ve en la web y en el cobro de Reveniu)
          <input className={campo} value={p.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug (identificador en la URL; no se cambia después)
          <input
            className={`${campo} disabled:opacity-60`}
            value={p.slug}
            disabled={!nuevo}
            placeholder="ej. premium"
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Precio mensual (CLP)
          <input className={campo} type="number" min={1000} max={200000} value={p.priceClp} onChange={(e) => set("priceClp", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mensajes por día
          <input className={campo} type="number" min={1} max={500} value={p.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Orden (menor = primero)
          <input className={campo} type="number" value={p.order} onChange={(e) => set("order", Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-3 text-sm sm:pt-6">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={p.published} onChange={(e) => set("published", e.target.checked)} />
          Publicado (a la venta en la web)
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Beneficios, uno por línea. El primero lo pone el sistema: «{p.dailyLimit} mensajes al día por WhatsApp».
        <textarea className={campo} rows={5} value={bullets} onChange={(e) => { setBullets(e.target.value); setEstado("idle"); }} />
      </label>
      <p className="text-xs text-on-surface-variant">
        {p.reveniuPlanId ? `Plan en Reveniu: ${p.reveniuPlanId}. ` : "Al guardar se crea su plan en Reveniu. "}
        Un precio nuevo rige para las suscripciones nuevas; las vigentes conservan su monto. Despublicar deja de
        venderlo, pero no le quita el acceso ni la cuota a quien ya lo tiene.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={guardar} disabled={estado === "guardando"} className="rounded-full bg-primary px-5 py-2 font-bold text-on-primary disabled:opacity-40">
          {estado === "guardando" ? "Guardando…" : nuevo ? "Crear plan" : "Guardar"}
        </button>
        {estado === "ok" && <span className="text-sm text-on-surface-variant">Guardado.</span>}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    </div>
  );
}
