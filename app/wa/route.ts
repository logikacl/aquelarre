import { backendPost } from "@/lib/backend";

// Botón de WhatsApp del home: cuenta el clic (embudo clic → chat → suscripción en
// /admin/promos) y redirige a wa.me. Si contar falla, igual redirige: el clic vale más que
// la métrica.
// ponytail: filtro de bots por user-agent; si el conteo sale inflado, algo más fino.
export async function GET(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!/bot|crawl|spider|preview|facebookexternalhit|whatsapp/i.test(ua)) {
    await backendPost("/api/clicks/wa", {}, "web").catch(() => {});
  }
  const numero = process.env.NEXT_WHATSAPP_NUMBER ?? "";
  return Response.redirect(`https://wa.me/${numero}?text=${encodeURIComponent("Hola 👋")}`, 302);
}
