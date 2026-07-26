"use client";
import { useState } from "react";
import { setPrice } from "@/app/admin/actions";

export default function PriceEditor({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // El backend rechaza un precio <= 0 con un 400: sin esto el botón no hacía nada visible.
  async function guardar() {
    setOcupado(true);
    setError("");
    try {
      const r = await setPrice(value);
      if (r?.error) setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error desconocido");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <label className="flex flex-col text-sm">
          Precio mensual (CLP)
          <input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))}
            className="mt-1 bg-surface-container border border-outline/30 rounded-lg py-2 px-3" />
        </label>
        <button onClick={guardar} disabled={ocupado}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-40">
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
