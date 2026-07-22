import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import SubscriptionManager from "@/components/SubscriptionManager";

export default async function Cuenta() {
  const session = await auth();
  const sub = await backendPost<{ status: string }>(
    "/api/subscription",
    { email: session!.user!.email },
    "web",
  );
  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <h1 className="text-4xl font-headline font-bold mb-8">Mi cuenta</h1>
      {sub.status === "none" ? (
        <p>Aún no tienes una suscripción. <a href="/checkout" className="underline text-primary">Suscríbete</a>.</p>
      ) : (
        <SubscriptionManager status={sub.status} />
      )}
    </main>
  );
}
