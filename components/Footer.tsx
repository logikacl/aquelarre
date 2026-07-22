export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-background py-12">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 w-full max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0">
          <span className="text-lg font-headline font-bold text-on-surface">Astros x Chat</span>
          <p className="mt-4 text-on-surface-variant text-sm max-w-xs font-body">
            La sabiduría del cosmos caminando contigo por Telegram. Disponible 24/7.
          </p>
        </div>
        <div className="flex gap-8 mb-8 md:mb-0">
          <nav className="flex flex-col gap-2">
            <span className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Compañía</span>
            <a
              className="font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100"
              href="#"
            >
              Contacto
            </a>
            <a
              className="font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100"
              href="#"
            >
              Privacidad
            </a>
            <a
              className="font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100"
              href="#"
            >
              Términos
            </a>
          </nav>
          <nav className="flex flex-col gap-2">
            <span className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Social</span>
            <a
              className="font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100"
              href="#"
            >
              Instagram
            </a>
            <a
              className="font-body text-sm text-on-surface-variant hover:text-tertiary transition-colors opacity-80 hover:opacity-100"
              href="#"
            >
              Facebook
            </a>
          </nav>
        </div>
        <div className="text-center md:text-right">
          <p className="font-body text-sm text-on-surface-variant">© 2026 Astros x Chat. Todos los derechos reservados.</p>
          <p className="mt-2 text-xs text-on-surface-variant opacity-50">Hecho con el corazón en las estrellas.</p>
        </div>
      </div>
    </footer>
  );
}
