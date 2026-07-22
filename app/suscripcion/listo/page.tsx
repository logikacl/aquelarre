import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.email) redirect("/checkout");
  const sub = await backendPost<{ status: string; chatId: number | null; linkToken: string | null }>(
    "/api/subscription",
    { email: session.user.email },
    "web",
  );
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const deepLink = sub.linkToken ? `https://t.me/${botUser}?start=${sub.linkToken}` : null;

  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
      {sub.status === "active" ? (
        <>
          <h1 className="text-4xl font-headline font-bold mb-4">¡Suscripción activa!</h1>
          {sub.chatId ? (
            <p className="text-on-surface-variant">Tu chat ya está conectado. Abre Telegram y escríbele a tu oráculo.</p>
          ) : deepLink ? (
            <a href={deepLink} className="inline-block mt-6 px-8 py-4 rounded-xl bg-primary text-on-primary font-bold">
              Abrir mi chat en Telegram
            </a>
          ) : (
            <p className="text-on-surface-variant">Tu chat ya fue enlazado. Ábrelo en Telegram.</p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-headline font-bold mb-4">Estamos confirmando tu pago…</h1>
          <p className="text-on-surface-variant">Puede tardar unos segundos. Recarga esta página o visita tu <a href="/cuenta" className="underline text-primary">cuenta</a>.</p>
        </>
      )}
    </main>
  );
}
