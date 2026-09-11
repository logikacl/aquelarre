import CookiePrefsButton from "@/components/CookiePrefsButton";
import { EMPRESA } from "@/lib/legal";

const heading = "font-bold text-xs uppercase tracking-widest text-primary mb-2";
const link =
  "font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100 text-left";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-background py-12">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 w-full max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0">
          <span className="text-lg font-headline font-bold text-on-surface">Astros x Chat</span>
          <p className="mt-4 text-on-surface-variant text-sm max-w-xs font-body">
            La sabiduría del cosmos caminando contigo por WhatsApp. Disponible 24/7.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 md:gap-12 mb-8 md:mb-0">
          <nav className="flex flex-col gap-2">
            <span className={heading}>Compañía</span>
            <a className={link} href={`mailto:${EMPRESA.contacto}`}>
              Contacto
            </a>
            <CookiePrefsButton />
          </nav>
          <nav className="flex flex-col gap-2">
            <span className={heading}>Legal</span>
            <a className={link} href="/terminos">
              Términos de Uso
            </a>
            <a className={link} href="/privacidad">
              Privacidad
            </a>
            <a className={link} href="/reembolsos">
              Política de Reembolso
            </a>
          </nav>
          <nav className="flex flex-col gap-2">
            <span className={heading}>Social</span>
            <a className={link} href="#">
              Instagram
            </a>
            <a className={link} href="#">
              Facebook
            </a>
          </nav>
        </div>
        <div className="text-center md:text-right">
          <p className="font-body text-sm text-on-surface-variant">© 2026 Astros x Chat. Todos los derechos reservados.</p>
          <p className="mt-1 text-xs text-on-surface-variant opacity-70">
            {EMPRESA.razonSocial} · RUT {EMPRESA.rut}
          </p>
          <p className="mt-2 text-xs text-on-surface-variant opacity-50">Hecho con el corazón en las estrellas.</p>
        </div>
      </div>
    </footer>
  );
}
