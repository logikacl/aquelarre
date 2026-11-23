"use client";

// Menú hamburguesa de Silente (silente-web/components/Header.tsx): cerrado queda fuera del
// teclado con `inert`, Escape lo cierra y devuelve el foco al botón.
import { useRef, useState } from "react";

const LINKS: [string, string][] = [
  ["Qué es Silente", "/#como-funciona"],
  ["Elige tu plan", "/#elige-tu-plan"],
  ["Preguntas frecuentes", "/#preguntas-frecuentes"],
];

export default function NavMenu({ cuenta, isAdmin }: { cuenta: { href: string; label: string }; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const links: [string, string][] = [...LINKS, [cuenta.label, cuenta.href], ...(isAdmin ? [["Admin", "/admin"] as [string, string]] : [])];

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="menu-principal"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)]"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-[var(--silente-gold-light)]" strokeWidth="1.6" strokeLinecap="round">
          <path d={open ? "m6 6 12 12M6 18 18 6" : "M3 6h18M3 12h18M3 18h18"} />
        </svg>
      </button>
      <div
        id="menu-principal"
        inert={!open}
        className={`absolute inset-x-0 top-full z-40 mt-1 transition-[max-height,opacity] duration-200 motion-reduce:transition-none ${open ? "max-h-[min(26rem,calc(100svh-7rem))] overflow-y-auto opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
      >
        <nav className="rounded-2xl border border-[rgba(213,170,75,.35)] bg-[rgba(5,14,22,.92)] p-2 backdrop-blur-xl" aria-label="Navegación principal">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-4 py-3 text-base text-[var(--silente-ivory)] transition-colors hover:bg-[rgba(213,170,75,.12)] hover:text-[var(--silente-gold-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--silente-gold-light)]"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
