"use client";
import { changeSubscription, deleteAccount } from "@/app/cuenta/actions";

export default function SubscriptionManager({ status }: { status: string }) {
  return (
    <div className="space-y-4">
      <p>Estado: <strong>{status}</strong></p>
      <div className="flex flex-wrap gap-3">
        {status === "active" && (
          <button onClick={() => changeSubscription("pause")} className="px-5 py-3 rounded-lg border border-primary/30">Pausar</button>
        )}
        {status === "paused" && (
          <button onClick={() => changeSubscription("reactivate")} className="px-5 py-3 rounded-lg bg-primary text-on-primary">Reactivar</button>
        )}
        {(status === "active" || status === "paused") && (
          <button onClick={() => changeSubscription("cancel")} className="px-5 py-3 rounded-lg border border-tertiary/40 text-tertiary">Cancelar</button>
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
