import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Nav() {
  const session = await auth();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 max-w-full mx-auto bg-surface/60 backdrop-blur-xl border-b border-primary/10">
      <div className="flex items-center gap-8">
        <Link className="text-xl font-headline font-bold text-primary tracking-tight" href="/">
          Astros x Chat
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            className="font-headline font-semibold tracking-tight text-primary border-b-2 border-primary pb-1"
            href="/#astrologos"
          >
            Astrólogos
          </Link>
          <Link
            className="font-headline font-semibold tracking-tight text-on-surface-variant hover:text-primary transition-colors"
            href="/planes"
          >
            Planes
          </Link>
          <Link
            className="font-headline font-semibold tracking-tight text-on-surface-variant hover:text-primary transition-colors"
            href="/#faq"
          >
            FAQ
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {(session as any)?.isAdmin && (
          <Link
            className="hidden md:inline font-headline font-semibold tracking-tight text-on-surface-variant hover:text-primary transition-colors"
            href="/admin"
          >
            Admin
          </Link>
        )}
        <Link
          className="px-6 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 font-headline font-semibold hover:bg-primary hover:text-on-primary transition-all duration-300 scale-95 active:scale-90"
          href={session ? "/cuenta" : "/ingresar"}
        >
          {session ? "Mi cuenta" : "Iniciar Sesión"}
        </Link>
      </div>
    </header>
  );
}
