"use client";

// Carrusel de testimonios (silente-web/components/TestimonialsCarousel.tsx). Los textos y
// fotos vienen del CMS; la sección completa se apaga desde /admin/contenido.
import { useEffect, useRef, useState } from "react";

export type Testimonio = { nombre: string; foto: string; cita: string };
export type TestimoniosCopy = { eyebrow: string; titulo: string; items: Testimonio[] };

export default function Testimonials({ copy }: { copy: TestimoniosCopy }) {
  const items = copy.items.filter((t) => t.cita.trim());
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!visible || paused || reducedMotion || interacting || hovered || items.length < 2) return;
    const interval = window.setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 5000);
    return () => window.clearInterval(interval);
  }, [visible, paused, reducedMotion, interacting, hovered, items.length]);

  if (items.length === 0) return null;
  const active = items[activeIndex % items.length];
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-[var(--silente-border)] text-lg text-[var(--silente-ivory)] transition-colors hover:border-[var(--silente-gold)] hover:text-[var(--silente-gold-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--silente-gold-light)]";

  return (
    <section ref={sectionRef} id="testimonios" aria-labelledby="testimonios-title" className="bg-[var(--silente-night)] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[.22em] text-[var(--silente-gold)]">{copy.eyebrow}</p>
          <h2 id="testimonios-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-.025em] text-[var(--silente-ivory)] md:text-5xl">
            {copy.titulo}
          </h2>
        </div>

        <div
          className="mx-auto mt-10 max-w-5xl"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
          }}
        >
          <article
            key={activeIndex}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`Testimonio ${activeIndex + 1} de ${items.length}`}
            className="testimonial-slide grid min-h-[380px] items-center gap-5 rounded-2xl border border-[rgba(213,170,75,.3)] bg-[rgba(23,35,49,.78)] p-5 md:min-h-[280px] md:grid-cols-[160px_1fr] md:gap-10 md:p-10"
          >
            <div className="flex justify-center">
              {active.foto && (
                <img
                  src={active.foto}
                  alt={active.nombre}
                  width={160}
                  height={160}
                  className="h-[88px] w-[88px] rounded-full border border-[rgba(229,196,106,.5)] object-cover md:h-40 md:w-40"
                />
              )}
            </div>
            <div>
              <span aria-hidden="true" className="text-4xl leading-none text-[var(--silente-gold)]">“</span>
              <blockquote className="mt-2 text-lg leading-relaxed text-[var(--silente-ivory)] md:text-2xl">{active.cita}</blockquote>
              <p className="mt-6 text-xs uppercase tracking-[.18em] text-[var(--silente-gold-light)]">{active.nombre}</p>
            </div>
          </article>

          {items.length > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-5 sm:flex-row">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setActiveIndex((i) => (i - 1 + items.length) % items.length)} aria-label="Ver testimonio anterior" className={btn}>←</button>
                <button
                  type="button"
                  onClick={() => setPaused((v) => !v)}
                  aria-pressed={paused}
                  aria-label={paused ? "Reanudar cambio automático" : "Pausar cambio automático"}
                  className="min-h-11 rounded-full border border-[var(--silente-border)] px-4 py-2 text-xs text-[var(--silente-muted)] transition-colors hover:border-[var(--silente-gold)] hover:text-[var(--silente-ivory)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--silente-gold-light)]"
                >
                  {paused ? "Reanudar" : "Pausar"}
                </button>
                <button type="button" onClick={() => setActiveIndex((i) => (i + 1) % items.length)} aria-label="Ver siguiente testimonio" className={btn}>→</button>
              </div>
              <div className="flex items-center" role="group" aria-label="Elegir testimonio">
                {items.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Mostrar testimonio ${i + 1}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                    className="group flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--silente-gold-light)]"
                  >
                    <span aria-hidden="true" className={`h-2.5 rounded-full transition-[width,background-color] motion-reduce:transition-none ${i === activeIndex ? "w-7 bg-[var(--silente-gold)]" : "w-2.5 bg-[var(--silente-border)] group-hover:bg-[var(--silente-gold-light)]"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
