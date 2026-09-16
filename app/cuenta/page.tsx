import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import SubscriptionManager from "@/components/SubscriptionManager";
import ChatLink from "@/components/ChatLink";
import { logout } from "@/app/ingresar/actions";

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

type Params = Promise<{ ok?: string; error?: string }>;

export default async function Cuenta({ searchParams }: { searchParams: Params }) {
  const session = await auth();
  const { ok, error } = await searchParams;
  const sub = await backendPost<{ status: string; chatId: number | null; phone: number | null }>(
    "/api/subscription",
    { email: session!.user!.email },
    "web",
  );
  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold">Mi cuenta</h1>
        <form action={logout}>
          <button className="text-sm text-on-surface-variant hover:text-primary underline" type="submit">
            Cerrar sesión
          </button>
        </form>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">{session!.user!.email}</p>
      <Aviso error={error} ok={ok} />
      {sub.status === "none" ? (
        <p>Aún no tienes una suscripción. <a href="/checkout" className="underline text-primary">Suscríbete</a>.</p>
      ) : (
        <div className="space-y-8">
          {/* El acceso al chat también acá, y no solo en /suscripcion/listo: quien llegó a esa
              página antes de que Reveniu activara se fue sin verlo, y ésta es la que visita al
              volver. */}
          {(sub.status === "active" || sub.status === "ending") && (
            <ChatLink
              chatId={sub.chatId}
              numeroBot={process.env.NEXT_WHATSAPP_NUMBER ?? ""}
              phone={sub.phone}
              volver="/cuenta"
            />
          )}
          <SubscriptionManager status={sub.status} />
        </div>
      )}
    </main>
  );
}
