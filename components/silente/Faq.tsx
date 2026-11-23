// Preguntas frecuentes (silente-web/components/ContentSections.tsx, FAQSection).
export type FaqCopy = { eyebrow: string; titulo: string; parrafo: string; items: { pregunta: string; respuesta: string }[] };

export default function Faq({ copy }: { copy: FaqCopy }) {
  return (
    <section id="preguntas-frecuentes" className="bg-[var(--silente-night)] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-20">
        <div>
          <p className="text-sm uppercase tracking-[.22em] text-[var(--silente-gold)]">{copy.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-.03em] text-[var(--silente-ivory)] md:text-6xl">
            {copy.titulo}
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--silente-muted)]">{copy.parrafo}</p>
        </div>

        <div className="divide-y divide-[var(--silente-border)] border-y border-[var(--silente-border)]">
          {copy.items.map(({ pregunta, respuesta }) => (
            <details key={pregunta} className="group py-5">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded text-lg text-[var(--silente-ivory)] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)]">
                <span>{pregunta}</span>
                <span aria-hidden="true" className="text-xl text-[var(--silente-gold)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pr-2 pt-4 text-base leading-7 text-[var(--silente-muted)]">{respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
