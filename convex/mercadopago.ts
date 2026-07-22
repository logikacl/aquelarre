// Helpers planos (no funciones Convex) para la API de suscripciones (preapproval)
// de MercadoPago. Sin SDK — fetch directo, igual que telegram.ts. CLP sin decimales.
// ponytail: MercadoPago detrás de esta interfaz mínima; para cambiar a Flow/Webpay se
// reemplaza este archivo sin tocar el resto.
const MP_API = "https://api.mercadopago.com";

export type MpStatus = "pending" | "authorized" | "paused" | "cancelled";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
  };
}

// Crea una suscripción SIN plan asociado. `externalReference` = _id de nuestra
// suscripción, para mapear de vuelta en el webhook. Devuelve el punto de redirect.
export async function createPreapproval(opts: {
  email: string;
  amountClp: number;
  reason: string;
  externalReference: string;
  backUrl: string;
}): Promise<{ id: string; init_point: string; status: MpStatus }> {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      reason: opts.reason,
      external_reference: opts.externalReference,
      payer_email: opts.email,
      back_url: opts.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: opts.amountClp,
        currency_id: "CLP",
      },
    }),
  });
  if (!res.ok) throw new Error(`MP createPreapproval ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return { id: d.id, init_point: d.init_point, status: d.status };
}

// Lee un preapproval por id (fuente de verdad del estado; se usa desde el webhook).
export async function getPreapproval(
  id: string,
): Promise<{ status: MpStatus; external_reference?: string }> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`MP getPreapproval ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return { status: d.status, external_reference: d.external_reference };
}

// Pausar / reactivar / cancelar: PUT status.
export async function setPreapprovalStatus(
  id: string,
  status: "paused" | "authorized" | "cancelled",
): Promise<void> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`MP setPreapprovalStatus ${res.status}: ${await res.text()}`);
}
