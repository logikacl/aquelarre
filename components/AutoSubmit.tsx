"use client";
import { useEffect, useRef } from "react";

// El auto-submit vive en un client component y no en un <script> del árbol: en el App Router
// ese script solo corre en carga dura, y hasta el puente de pago se llega por navegación de
// cliente desde /checkout — el único camino que recorre un cliente real.
//
// El botón se renderiza igual, así que sigue existiendo el camino sin JavaScript.
export default function AutoSubmit({ action, token }: { action: string; token: string }) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current?.submit();
  }, []);

  return (
    <form ref={form} method="POST" action={action}>
      <input type="hidden" name="TBK_TOKEN" value={token} />
      <button type="submit" className="px-8 py-4 rounded-xl bg-primary text-on-primary font-bold">
        Continuar al pago
      </button>
    </form>
  );
}
