import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import ChatLink from "@/components/ChatLink";
import { redirect } from "next/navigation";

const AVISOS: Record<string, { texto: string; error?: boolean }> = {
  "ok=telefono": { texto: "Número guardado. Escríbele al oráculo desde ese WhatsApp y tu suscripción se conecta sola." },
  "error=telefono": { texto: "No pudimos guardar ese número. Escribe tu celular, por ejemplo 9 1234 5678.", error: true },
};

function Aviso({ ok, error }: { ok?: string; error?: string }) {
  const a = ok ? AVISOS[`ok=${ok}`] : error ? AVISOS[`error=${error}`] : undefined;
  if (!a) return null;
  return (
    <p
      className={`text-sm rounded-lg py-3 px-4 mb-6 border ${
        a.error ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-primary bg-primary/10 border-primary/20"
      }`}
      role={a.error ? "alert" : "status"}
    >
      {a.texto}
    </p>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await auth();
  const { ok, error } = await searchParams;
  // Sin sesión se va a iniciar sesión, no a /checkout: quien llega acá acaba de pagar
  // (volvió de Webpay en otro navegador, o se le venció la sesión), y /checkout lo invitaba a
  // pagar de nuevo. Tras entrar aterriza en /cuenta, que también muestra el enlace al chat.
  if (!session?.user?.email) redirect("/ingresar");
  const sub = await backendPost<{ status: string; chatId: number | null; phone: number | null }>(
    "/api/subscription",
    { email: session.user.email },
    "web",
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
      {sub.status === "active" ? (
        <>
          <h1 className="text-4xl font-headline font-bold mb-4">¡Suscripción activa!</h1>
          <Aviso error={error} ok={ok} />
          <div className="mt-6">
            <ChatLink
              chatId={sub.chatId}
              numeroBot={process.env.NEXT_WHATSAPP_NUMBER ?? ""}
              phone={sub.phone}
              volver="/suscripcion/listo"
            />
          </div>
        </>
      ) : (
        <>
          {/* Reveniu cobra unos minutos después de inscribir la tarjeta, así que acá casi
              siempre se llega antes de la activación. Un meta refresh evita que el cliente
              se quede mirando esta pantalla sin saber que tiene que recargar. */}
          <meta httpEquiv="refresh" content="5" />
          <h1 className="text-3xl font-headline font-bold mb-4">Estamos confirmando tu pago…</h1>
          <p className="text-on-surface-variant">
            Puede tardar unos minutos. Esta página se actualiza sola; también puedes verlo en tu{" "}
            <a href="/cuenta" className="underline text-primary">
              cuenta
            </a>
            .
          </p>
        </>
      )}
    </main>
  );
}
