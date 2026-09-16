"use client";
import { useRef, useState } from "react";
import { reglasPassword } from "@/convex/passwordRules";
import PasswordInput from "@/components/PasswordInput";

// Contraseña + confirmación con aviso en vivo. El bloqueo del envío lo hace el navegador
// (setCustomValidity): así el formulario sigue siendo una server action simple y nadie pierde
// lo que ya escribió por descubrir el problema después de apretar el botón.
// La validación que manda es la de Convex; esto es para la persona, no para la seguridad.
export default function PasswordFields({ inputClass, labelClass }: { inputClass: string; labelClass: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const pwRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const reglas = reglasPassword(pw, email);
  const coinciden = pw === confirm;

  // Se recalcula en cada tecla de cualquiera de los dos campos: si solo se validara el campo
  // que cambió, corregir la clave dejaría la confirmación marcada como inválida.
  function actualizar(nuevoPw: string, nuevoConfirm: string, form: HTMLFormElement | null) {
    const correo = (form?.elements.namedItem("email") as HTMLInputElement | null)?.value ?? "";
    setEmail(correo);
    const validas = reglasPassword(nuevoPw, correo).every((r) => r.ok);
    pwRef.current?.setCustomValidity(validas ? "" : "La contraseña no cumple los requisitos.");
    confirmRef.current?.setCustomValidity(nuevoPw === nuevoConfirm ? "" : "Las contraseñas no coinciden.");
  }

  return (
    <>
      <div className="md:col-span-2 space-y-2">
        <label className={labelClass} htmlFor="password">
          Contraseña
        </label>
        <PasswordInput
          aria-describedby="password-reglas"
          autoComplete="new-password"
          className={inputClass}
          id="password"
          name="password"
          onChange={(e) => {
            setPw(e.target.value);
            actualizar(e.target.value, confirm, e.target.form);
          }}
          placeholder="••••••••••"
          ref={pwRef}
          required
          value={pw}
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs ml-1" id="password-reglas">
          {reglas.map((r) => (
            <li className={r.ok ? "text-primary" : "text-on-surface-variant"} key={r.texto}>
              <span aria-hidden="true">{r.ok ? "✓" : "○"}</span> {r.texto}
              <span className="sr-only">{r.ok ? " (cumple)" : " (pendiente)"}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className={labelClass} htmlFor="confirm">
          Repite la contraseña
        </label>
        <PasswordInput
          aria-describedby="confirm-estado"
          autoComplete="new-password"
          className={inputClass}
          id="confirm"
          name="confirm"
          onChange={(e) => {
            setConfirm(e.target.value);
            actualizar(pw, e.target.value, e.target.form);
          }}
          placeholder="••••••••••"
          ref={confirmRef}
          required
          value={confirm}
        />
        <p aria-live="polite" className="text-xs ml-1 min-h-4" id="confirm-estado">
          {confirm &&
            (coinciden ? (
              <span className="text-primary">✓ Las contraseñas coinciden</span>
            ) : (
              <span className="text-red-400">Las contraseñas no coinciden</span>
            ))}
        </p>
      </div>
    </>
  );
}
