import Link from "next/link";
import { auth } from "@/lib/auth";
import NavMenu from "@/components/NavMenu";

// Header de Silente (silente-web/components/Header.tsx): logo centrado y menú a la derecha.
// Va absoluto sobre la página para que el hero de la home quede debajo, como en el diseño;
// las demás páginas ya dejan su margen superior (pt-28/pt-32).
export default async function Nav() {
  const session = await auth();
  const cuenta = session ? { href: "/cuenta", label: "Mi cuenta" } : { href: "/ingresar", label: "Iniciar sesión" };
  const isAdmin = Boolean((session as { isAdmin?: boolean } | null)?.isAdmin);

  return (
    <header className="absolute inset-x-0 top-0 z-30 px-4 md:px-8">
      <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-center md:h-24">
        <Link
          href={cuenta.href}
          className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full border border-[rgba(213,170,75,.4)] px-4 py-2 text-sm text-[var(--silente-gold-light)] transition-colors hover:border-[var(--silente-gold-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)] md:inline-flex"
        >
          {cuenta.label}
        </Link>
        <Link
          href="/"
          aria-label="Silente, inicio"
          className="flex items-center justify-center focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)]"
        >
          <img src="/logo-silente.webp" alt="Silente" width={640} height={692} className="h-[64px] w-auto object-contain md:h-[84px]" />
        </Link>
        <NavMenu cuenta={cuenta} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
