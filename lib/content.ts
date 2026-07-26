import "server-only";
import { backendGet } from "@/lib/backend";
import { COPY_DEFAULTS } from "@/lib/copy";

// Lee los overrides del backend y cae al default del código. Nunca revienta la página:
// si el backend falla, se sirve el copy por defecto.
export async function getCopy(): Promise<(key: string) => string> {
  let overrides: Record<string, string> = {};
  try {
    overrides = await backendGet<Record<string, string>>("/api/public/content");
  } catch {
    // el copy en código alcanza para renderizar; no vale tumbar la página por esto
  }
  return (key) => overrides[key] ?? COPY_DEFAULTS[key] ?? "";
}
