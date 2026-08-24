// Helpers planos (no funciones Convex) para la API de suscripciones de Reveniu.
// Sin SDK — fetch directo, igual que telegram.ts. CLP sin decimales.
// ponytail: Reveniu detrás de esta interfaz mínima; para cambiar de pasarela se reemplaza
// este archivo sin tocar el resto.

// La base URL es env y no constante: sandbox (integration.reveniu.com) y producción
// (production.reveniu.com) son hosts distintos. Verificado el 2026-08-24: el api.reveniu.com
// que menciona su doc de Autenticación ni siquiera resuelve DNS.
const api = () => process.env.REVENIU_API_URL;

function headers() {
  return {
    "Content-Type": "application/json",
    "Reveniu-Secret-Key": process.env.REVENIU_API_SECRET!,
  };
}

async function post(path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${api()}${path}`, {
    method: "POST",
    headers: headers(),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`Reveniu POST ${path} ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Crea la suscripción y devuelve a dónde mandar al usuario. `externalId` = _id de nuestra
// suscripción; Reveniu lo devuelve en todos los webhooks de esa suscripción.
export async function createSubscription(opts: {
  email: string;
  name: string;
  amountClp: number;
  externalId: string;
}): Promise<{ id: number; completionUrl: string; securityToken: string }> {
  const d = await post("/api/v1/subscriptions/", {
    plan_id: Number(process.env.REVENIU_PLAN_ID),
    external_id: opts.externalId,
    field_values: {
      email: opts.email,
      name: opts.name,
      amount: opts.amountClp,
    },
  });
  return { id: d.id, completionUrl: d.completion_url, securityToken: d.security_token };
}

// "No renovar": la suscripción sigue activa hasta el fin del período ya pagado.
export const disableRenew = (id: number) => post(`/api/v1/subscriptions/${id}/disablerenew/`);

// Baja inmediata.
export const disable = (id: number) => post(`/api/v1/subscriptions/${id}/disable/`);
