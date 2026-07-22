import "server-only";

const BASE = process.env.CONVEX_SITE_URL!;

type Secret = "web" | "admin" | "none";

function headers(secret: Secret): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (secret === "web") h["X-Web-Api-Secret"] = process.env.WEB_API_SECRET!;
  if (secret === "admin") h["X-Admin-Api-Secret"] = process.env.ADMIN_API_SECRET!;
  return h;
}

// POST a una httpAction de Convex. Nunca se importa desde un Client Component (server-only).
export async function backendPost<T>(path: string, body: unknown, secret: Secret = "web"): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`backend ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// GET público (marketing). Revalida cada 60s.
export async function backendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`backend GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}
