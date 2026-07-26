"use client";
import { useState } from "react";
import { setUserSubscription, deleteUser } from "@/app/admin/actions";

export type UserRow = {
  email: string;
  name: string;
  createdAt: number;
  status: "none" | "pending" | "active" | "paused" | "cancelled";
  chatId: number | null;
  mpPreapprovalId: string | null;
  subUpdatedAt: number | null;
};

const ESTADO: Record<UserRow["status"], { texto: string; clase: string }> = {
  active: { texto: "Activa", clase: "bg-primary text-on-primary" },
  pending: { texto: "Pendiente", clase: "bg-primary/15 text-primary" },
  paused: { texto: "Pausada", clase: "bg-surface-container text-on-surface-variant border border-outline/40" },
  cancelled: { texto: "Cancelada", clase: "bg-error/10 text-error" },
  none: { texto: "Sin suscripción", clase: "text-on-surface-variant border border-outline/30" },
};

const fecha = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("es-CL", { timeZone: "America/Santiago" }) : "—";

export default function UsersTable({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null); // email de la fila en curso
  const [error, setError] = useState<string | null>(null);

  // ponytail: filtro en cliente sobre la lista completa. Paginar en servidor cuando la
  // cantidad de usuarios haga pesado el payload (orden de miles de filas).
  const visibles = rows.filter((r) => {
    const t = q.trim().toLowerCase();
    return !t || r.email.toLowerCase().includes(t) || r.name.toLowerCase().includes(t);
  });

  async function correr(email: string, fn: () => Promise<{ error: string } | void>) {
    setOcupado(email);
    setError(null);
    try {
      const r = await fn();
      if (r?.error) setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error desconocido");
    } finally {
      setOcupado(null);
    }
  }

  const btn = "px-3 py-1 rounded-lg border border-outline/40 text-sm disabled:opacity-40";

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por email o nombre"
        aria-label="Buscar usuarios por email o nombre"
        className="w-full max-w-sm bg-surface-container border border-outline/30 rounded-lg py-2 px-3"
      />

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm text-left">
          <thead className="text-on-surface-variant border-b border-outline/30">
            <tr>
              <th className="py-2 pr-4 font-normal">Email</th>
              <th className="py-2 pr-4 font-normal">Nombre</th>
              <th className="py-2 pr-4 font-normal">Estado</th>
              <th className="py-2 pr-4 font-normal">Telegram</th>
              <th className="py-2 pr-4 font-normal">Alta</th>
              <th className="py-2 pr-4 font-normal">Suscripción act.</th>
              <th className="py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => {
              const esperando = ocupado === r.email;
              // Sin preapproval en MercadoPago ninguna acción de suscripción funciona:
              // no se muestran botones muertos. Reactivar solo desde "paused", porque MP
              // no reautoriza un preapproval ya cancelado.
              const gestionable = r.mpPreapprovalId !== null;
              return (
                <tr key={r.email} className="border-b border-outline/20">
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${ESTADO[r.status].clase}`}>
                      {ESTADO[r.status].texto}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{r.chatId !== null ? "Sí" : "No"}</td>
                  <td className="py-2 pr-4">{fecha(r.createdAt)}</td>
                  <td className="py-2 pr-4">{fecha(r.subUpdatedAt)}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {gestionable && r.status === "active" && (
                        <button disabled={esperando} className={btn}
                          onClick={() => correr(r.email, () => setUserSubscription(r.email, "pause"))}>
                          Pausar
                        </button>
                      )}
                      {gestionable && r.status === "paused" && (
                        <button disabled={esperando} className={btn}
                          onClick={() => correr(r.email, () => setUserSubscription(r.email, "reactivate"))}>
                          Reactivar
                        </button>
                      )}
                      {gestionable && (r.status === "active" || r.status === "paused") && (
                        <button disabled={esperando} className={btn}
                          onClick={() => correr(r.email, () => setUserSubscription(r.email, "cancel"))}>
                          Cancelar
                        </button>
                      )}
                      <button
                        disabled={esperando}
                        className={`${btn} border-error/40 text-error`}
                        onClick={() => {
                          if (
                            confirm(
                              `Eliminar a ${r.email}: borra la cuenta, la suscripción y TODO el historial de chat. ` +
                                `Es irreversible (supresión Ley 21.719). ¿Continuar?`,
                            )
                          )
                            correr(r.email, () => deleteUser(r.email));
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibles.length === 0 && <p className="text-on-surface-variant text-sm">Sin resultados.</p>}
    </div>
  );
}
