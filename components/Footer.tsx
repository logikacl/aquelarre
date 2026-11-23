import CookiePrefsButton from "@/components/CookiePrefsButton";
import { EMPRESA } from "@/lib/legal";

// Pie de Silente (silente-web/components/SiteFooter.tsx) + los datos de la sociedad, que
// la ley de consumidor pide visibles. "Preferencias de cookies" abre nuestro CMP.
const h = "text-xs font-semibold uppercase tracking-[.18em] text-[var(--silente-gold)]";
const a = "transition-colors hover:text-[var(--silente-ivory)]";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--silente-border)] px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[rgba(213,170,75,.3)] bg-[rgba(23,35,49,.72)] p-6 md:p-9">
        <a href="/" className="block text-center tracking-[.18em] text-[var(--silente-gold)]">SILENTE</a>
        <div className="mt-8 grid gap-8 text-center sm:grid-cols-3 sm:text-left">
          <section>
            <h2 className={h}>Compañía</h2>
            <a className="mt-4 block text-sm text-[var(--silente-ivory)] transition-colors hover:text-[var(--silente-gold-light)]" href={`mailto:${EMPRESA.contacto}`}>
              Contacto
            </a>
            <CookiePrefsButton />
          </section>
          <section>
            <h2 className={h}>Legal</h2>
            <nav aria-label="Información legal" className="mt-4 flex flex-col items-center gap-3 text-sm text-[var(--silente-muted)] sm:items-start">
              <a className={a} href="/terminos">Términos</a>
              <a className={a} href="/privacidad">Privacidad</a>
              <a className={a} href="/reembolsos">Reembolsos</a>
            </nav>
          </section>
          <section>
            <h2 className={h}>Redes sociales</h2>
            {/* ponytail: las cuentas todavía no existen. Al crearlas, poner acá sus URLs. */}
            <p className="mt-4 text-sm text-[var(--silente-muted)]">Muy pronto en Instagram, TikTok y Facebook.</p>
          </section>
        </div>
        <p className="mt-8 border-t border-[var(--silente-border)] pt-6 text-center text-xs text-[var(--silente-muted)]">
          © 2026 Silente · {EMPRESA.razonSocial} · RUT {EMPRESA.rut}
        </p>
      </div>
    </footer>
  );
}
