import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { redirect } from "next/navigation";

type CheckoutRes =
  | { alreadyActive: true }
  | { completionUrl: string; securityToken: string; linkToken: string };

// Puente hacia Transbank. No es una página de contenido: existe porque Transbank exige un
// POST con TBK_TOKEN y un redirect() de Next no puede hacer eso.
//
// El token se pide acá, en el render del server component, y no viaja por query params a
// propósito: en la URL quedaría en el historial del navegador y en los logs de Vercel.
export default async function Pagar() {
  const session = await auth();
  if (!session?.user?.email) redirect("/checkout");

  const res = await backendPost<CheckoutRes>(
    "/api/checkout",
    { email: session.user.email, name: session.user.name ?? "" },
    "web",
  );
  if ("alreadyActive" in res) redirect("/cuenta");

  return (
    <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-headline font-bold mb-4">Te estamos llevando al pago…</h1>
      <p className="text-on-surface-variant mb-8">
        Si no ocurre nada en unos segundos, usa el botón.
      </p>
      <form method="POST" action={res.completionUrl}>
        <input type="hidden" name="TBK_TOKEN" value={res.securityToken} />
        <button
          type="submit"
          className="px-8 py-4 rounded-xl bg-primary text-on-primary font-bold"
        >
          Continuar al pago
        </button>
      </form>
      {/* El botón es el camino sin JavaScript; esto lo envía solo cuando sí hay. */}
      <script dangerouslySetInnerHTML={{ __html: "document.forms[0].submit()" }} />
    </main>
  );
}
