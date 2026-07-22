"use client";
import { useState } from "react";
import { setPrice } from "@/app/admin/actions";

export default function PriceEditor({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  return (
    <div className="flex items-end gap-3">
      <label className="flex flex-col text-sm">
        Precio mensual (CLP)
        <input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))}
          className="mt-1 bg-surface-container border border-outline/30 rounded-lg py-2 px-3" />
      </label>
      <button onClick={() => setPrice(value)} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold">Guardar</button>
    </div>
  );
}
