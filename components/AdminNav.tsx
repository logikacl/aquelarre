"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const secciones = [
  { href: "/admin", label: "Precio" },
  { href: "/admin/oraculos", label: "Astrólogos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/churn", label: "Churn" },
  { href: "/admin/contenido", label: "Contenido" },
];

export default function AdminNav() {
  // Comparación exacta: /admin es prefijo de todas las demás secciones.
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {secciones.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`px-4 py-2 rounded-lg font-headline font-semibold border transition-colors ${
            pathname === s.href
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container border-outline/30 text-on-surface-variant hover:text-primary"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
