"use client";
import { useState } from "react";

// Sube el archivo a /admin/upload (que reenvía a Convex) y devuelve la URL.
// La URL queda editable a mano para poder pegar una imagen externa.
export default function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(file: File) {
    setSubiendo(true);
    setError("");
    try {
      const res = await fetch("/admin/upload", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `error ${res.status}`);
      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-on-surface-variant">
        {label}
        <input
          type="file"
          accept="image/*"
          disabled={subiendo}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) subir(file);
          }}
          className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold disabled:opacity-50"
        />
      </label>
      <input
        placeholder="URL de la imagen"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container border border-outline/30 rounded-lg py-2 px-3"
      />
      {subiendo && <p className="text-sm text-on-surface-variant">Subiendo…</p>}
      {error && <p className="text-sm text-error">{error}</p>}
      {value && (
        <img src={value} alt="" className="w-24 h-24 rounded-lg object-cover border border-outline/20" />
      )}
    </div>
  );
}
