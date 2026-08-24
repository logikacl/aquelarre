"use client";
import { changeSubscription, deleteAccount } from "@/app/cuenta/actions";

const TEXTO: Record<string, string> = {
  active: "Activa",
  ending: "Activa hasta el fin del período (no se renovará)",
  pending: "Pendiente de pago",
  cancelled: "Cancelada",
};

export default function SubscriptionManager({ status }: { status: string }) {
  return (
    <div className="space-y-4">
      <p>Estado: <strong>{TEXTO[status] ?? status}</strong></p>
      <div className="flex flex-wrap gap-3">
        {status === "active" && (
          <button onClick={() => changeSubscription("no_renovar")} className="px-5 py-3 rounded-lg border border-primary/30">No renovar</button>
        )}
        {(status === "active" || status === "ending") && (
          <button onClick={() => changeSubscription("cancel")} className="px-5 py-3 rounded-lg border border-tertiary/40 text-tertiary">Cancelar ahora</button>
        )}
        {/* Reveniu no reactiva una suscripción dada de baja: hay que registrar la tarjeta
            de nuevo, y eso es un checkout. */}
        {(status === "cancelled" || status === "pending") && (
          <a href="/suscripcion/pagar" className="px-5 py-3 rounded-lg bg-primary text-on-primary">Suscribirme de nuevo</a>
        )}
        <button
          onClick={() => { if (confirm("Esto borra tu cuenta y todo tu historial. ¿Seguro?")) deleteAccount(); }}
          className="px-5 py-3 rounded-lg border border-error/40 text-error"
        >
          Eliminar todos mis datos
        </button>
      </div>
    </div>
  );
}
