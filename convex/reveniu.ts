// Helpers planos (no funciones Convex) para la API de suscripciones de Reveniu.
// Sin SDK — fetch directo, igual que whatsapp.ts. CLP sin decimales.
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

async function call(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${api()}${path}`, {
    method,
    headers: headers(),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`Reveniu ${method} ${path} ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
const post = (path: string, body?: unknown) => call("POST", path, body);

// Crea la suscripción y devuelve a dónde mandar al usuario. `externalId` = _id de nuestra
// suscripción; Reveniu lo devuelve en todos los webhooks de esa suscripción.
export async function createSubscription(opts: {
  email: string;
  name: string;
  amountClp: number;
  externalId: string;
  planId: number;
}): Promise<{ id: number; completionUrl: string; securityToken: string }> {
  const d = await post("/api/v1/subscriptions/", {
    plan_id: opts.planId,
    external_id: opts.externalId,
    field_values: {
      email: opts.email,
      name: opts.name,
      amount: opts.amountClp,
    },
  });
  return { id: d.id, completionUrl: d.completion_url, securityToken: d.security_token };
}

// Estado de una suscripción (status, payment_method…). Respaldo del webhook.
export const getSubscription = (id: number) => call("GET", `/api/v1/subscriptions/${id}/`);

// "No renovar": la suscripción sigue activa hasta el fin del período ya pagado.
export const disableRenew = (id: number) => post(`/api/v1/subscriptions/${id}/disablerenew/`);

// Baja inmediata.
export const disable = (id: number) => post(`/api/v1/subscriptions/${id}/disable/`);

// Un plan nuestro = un plan de Reveniu de monto abierto (el monto lo manda cada suscripción,
// así el precio vive en Convex). Mismo cuerpo que scripts/reveniu-plan.sh. frequency 3 =
// mensual; cicles 1 + auto_renew = indefinida. La URL de retorno vive en el plan.
// Las rutas exigen barra final (sin ella, 301).
export async function createPlan(opts: { title: string; priceClp: number; min: number; max: number }): Promise<number> {
  const base = process.env.WEB_BASE_URL;
  const d = await post("/api/v1/plans/", {
    frequency: 3,
    cicles: 1,
    title: opts.title,
    description: "Conversación privada con Luna por WhatsApp",
    price: opts.priceClp,
    is_custom_amount: true,
    custom_amount_min: opts.min,
    custom_amount_max: opts.max,
    auto_renew: true,
    redirect_to: `${base}/suscripcion/listo`,
    redirect_to_failure: `${base}/checkout?error=pago`,
  });
  return d.id;
}

// El título del plan es lo que Reveniu muestra al cobrar. PATCH acepta cambios parciales.
export const updatePlanTitle = (id: number, title: string) => call("PATCH", `/api/v1/plans/${id}/`, { title });
