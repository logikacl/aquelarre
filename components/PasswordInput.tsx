"use client";
import { useState, type ComponentProps } from "react";

// Campo de contraseña con botón para mostrar u ocultar lo escrito. Recibe las mismas props
// que un <input> (ref incluida: React 19 la pasa como prop), así que reemplaza a
// <input type="password"> sin cambiar nada más.
export default function PasswordInput({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {/* pr-12: que el texto no quede debajo del botón */}
      <input {...props} className={`${className} pr-12`} type={visible ? "text" : "password"} />
      <button
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant hover:text-primary transition-colors"
        onClick={() => setVisible((v) => !v)}
        // type="button": sin esto, tocar el ojo enviaría el formulario.
        type="button"
      >
        <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
          {visible ? (
            // ojo tachado: el texto está a la vista, tocar lo oculta
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="1" x2="23" y1="1" y2="23" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
