"use client";
import { useRef, useState } from "react";
import { formatearTelefono, normalizarTelefono } from "@/convex/telefono";

// Número de WhatsApp con confirmación en vivo: muestra cómo quedó entendido ("+56 9 7864 4790")
// para que un dígito de más o de menos se note antes de guardar. Un número mal escrito no
// rompe nada, pero deja la suscripción sin enlazar hasta que se corrija.
// Como en PasswordFields, el bloqueo del envío lo hace el navegador y la validación que manda
// es la de Convex.
export default function PhoneInput({
  className,
  defaultValue = "",
  id = "telefono",
}: {
  className: string;
  defaultValue?: string;
  id?: string;
}) {
  const [valor, setValor] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);
  const numero = normalizarTelefono(valor);

  return (
    <>
      <input
        aria-describedby={`${id}-estado`}
        autoComplete="tel"
        className={className}
        id={id}
        inputMode="tel"
        name="telefono"
        onChange={(e) => {
          setValor(e.target.value);
          ref.current?.setCustomValidity(
            normalizarTelefono(e.target.value) ? "" : "Escribe tu celular, por ejemplo 9 1234 5678.",
          );
        }}
        placeholder="9 1234 5678"
        ref={ref}
        required
        type="tel"
        value={valor}
      />
      <p aria-live="polite" className="text-xs ml-1 min-h-4" id={`${id}-estado`}>
        {valor &&
          (numero ? (
            <span className="text-primary">✓ {formatearTelefono(numero)}</span>
          ) : (
            <span className="text-on-surface-variant">Escribe tu celular, por ejemplo 9 1234 5678</span>
          ))}
      </p>
    </>
  );
}
