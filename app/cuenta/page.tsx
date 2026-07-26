import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import SubscriptionManager from "@/components/SubscriptionManager";
import { logout } from "@/app/ingresar/actions";

export default async function Cuenta() {
  const session = await auth();
  const sub = await backendPost<{ status: string }>(
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
      {sub.status === "none" ? (
        <p>Aún no tienes una suscripción. <a href="/checkout" className="underline text-primary">Suscríbete</a>.</p>
      ) : (
        <SubscriptionManager status={sub.status} />
      )}
    </main>
  );
}
