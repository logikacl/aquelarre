import { auth } from "@/lib/auth";
import { backendRaw } from "@/lib/backend";

// Borde de confianza: middleware.ts ya cubre /admin/*, pero acá se inyecta el
// ADMIN_API_SECRET (que nunca llega al navegador), así que la sesión se revalida.
export async function POST(req: Request) {
  const session = await auth();
  if (!(session as any)?.isAdmin) return Response.json({ error: "no autorizado" }, { status: 403 });
  try {
    const { url } = await backendRaw<{ url: string }>(
      "/api/admin/upload",
      await req.arrayBuffer(),
      req.headers.get("content-type") ?? "application/octet-stream",
    );
    return Response.json({ url });
  } catch (e) {
    // El backend rechaza por tipo (415) o tamaño (413): el admin necesita ver el porqué.
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
