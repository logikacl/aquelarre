import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import TelegramLink from "@/components/TelegramLink";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.email) redirect("/checkout");
  const sub = await backendPost<{ status: string; chatId: number | null; linkToken: string | null }>(
    "/api/subscription",
    { email: session.user.email },
    "web",
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
      {sub.status === "active" ? (
        <>
          <h1 className="text-4xl font-headline font-bold mb-4">¡Suscripción activa!</h1>
          <div className="mt-6">
            <TelegramLink linkToken={sub.linkToken} chatId={sub.chatId} />
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
