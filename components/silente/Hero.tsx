"use client";

// Hero de Silente, portado de ElCopyPaste/silente-web (components/Hero.tsx + Benefits.tsx).
// Diferencias con el original: el texto llega por props (CMS), el header es el Nav global
// (acá queda un espaciador de su altura), y el fundido de saber/hablar es CSS en vez de la
// librería motion.
import { useEffect, useState } from "react";
import SilenteSymbol from "./SilenteSymbol";

export type HeroCopy = {
  titulo: string;
  palabras: [string, string];
  frases: [string, string];
  intro: string;
  preguntas: string[];
  cta: string;
  beneficios: [string, string, string];
};

const desktopPositions = [
  "left-[5%] top-[8%]",
  "right-[5%] top-[8%]",
  "left-[1%] top-[42%]",
  "right-[1%] top-[42%]",
  "left-[6%] bottom-[8%]",
  "right-[6%] bottom-[8%]",
];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M12 2.25a9.75 9.75 0 0 0-8.42 14.53L2.3 21.7l5.04-1.25A9.75 9.75 0 1 0 12 2.25Zm0 17.75a8 8 0 0 1-4.08-1.12l-.29-.17-2.99.74.76-2.91-.19-.3A8 8 0 1 1 12 20Zm4.38-5.94c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.11.15 1.53.09.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

const ICONOS = [
  // burbuja de chat: el original era un infinito, que prometía conversación ilimitada
  <svg key="a" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.5"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 10h8M8 14h5" /></svg>,
  <svg key="b" viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="c" viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" /></svg>,
];

export default function Hero({ copy }: { copy: HeroCopy }) {
  const [i, setI] = useState<0 | 1>(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setI((v) => (v === 0 ? 1 : 0)), 4000);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const goToHow = () =>
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });

  // El ancho de la palabra lo reserva la más larga de las dos, para que el título no salte.
  const larga = copy.palabras[0].length >= copy.palabras[1].length ? copy.palabras[0] : copy.palabras[1];
  const partes = copy.titulo.trim().split(/\s+/);
  const ultima = partes.pop() ?? "";
  const inicio = partes.join(" ");

  return (
    <section className="silente-hero silente-stars relative isolate min-h-[100svh] overflow-hidden bg-[#07111d] px-4 pb-10 pt-3 md:px-8 md:pb-14 md:pt-5">
      <picture className="hero-background absolute inset-[-2%] z-0">
        <source media="(min-width: 1024px)" srcSet="/fondo-desktop.webp" />
        <img
          src="/fondo-centrado.webp"
          alt=""
          fetchPriority="high"
          className="pointer-events-none h-full w-full object-cover object-center"
        />
      </picture>
      <div aria-hidden="true" className="h-20 md:h-24" />

      <div className="hero-content relative z-10 mx-auto mt-6 max-w-6xl text-center md:mt-7">
        <h1 className="w-full text-center text-[clamp(1.75rem,8.4vw,2.5rem)] font-normal leading-[1.08] tracking-[-.035em] text-[var(--silente-ivory)] md:text-[clamp(2.75rem,5vw,4.5rem)]">
          {/* Como en el diseño: en móvil la última palabra del título baja junto a la que
              alterna ("Hay cosas que / necesitas saber."); desde lg el CSS los pone en línea. */}
          <span className="block whitespace-nowrap">{inicio}</span>{" "}
          <span className="mt-1 block whitespace-nowrap">
            {ultima}{" "}
            <span className="relative inline-block align-baseline">
              <span aria-hidden="true" className="invisible">{larga}</span>
              <span key={i} className="silente-swap absolute left-0 top-0 whitespace-nowrap">
                {copy.palabras[i]}
              </span>
            </span>
          </span>
        </h1>

        <p
          key={`frase-${i}`}
          className="silente-swap mt-3 min-h-[1.4em] w-full text-center text-[clamp(1.25rem,4.1vw,2.1rem)] font-normal tracking-[-.025em] text-[var(--silente-gold-light)] md:mt-4"
        >
          {copy.frases[i]}
        </p>
        <p className="hero-intro mx-auto mt-3 max-w-[700px] text-base leading-6 text-[var(--silente-ivory)]/90">
          {copy.intro}
        </p>

        <div className="hero-orbit relative mx-auto mt-4 h-[440px] w-full max-w-6xl md:mt-5 md:h-[480px] lg:h-[clamp(400px,46vh,460px)]">
          <div className="hero-symbol-anchor">
            <SilenteSymbol />
          </div>

          {copy.preguntas.map((q, n) => (
            <button
              key={`d-${n}`}
              type="button"
              onClick={goToHow}
              className={`question-capsule question-capsule-${n} absolute hidden max-w-[240px] px-5 py-4 text-center text-sm leading-[1.35] text-[var(--silente-ivory)] lg:block ${desktopPositions[n]}`}
            >
              <span className="relative z-10">{q}</span>
            </button>
          ))}
          {copy.preguntas.map((q, n) => (
            <button
              key={`m-${n}`}
              type="button"
              onClick={goToHow}
              className={`question-capsule question-mobile question-capsule-${n} min-h-14 px-3 py-3 text-center text-base leading-[1.35] text-[var(--silente-ivory)] lg:hidden`}
            >
              <span className="relative z-10">{q}</span>
            </button>
          ))}
        </div>

        {/* A los planes y no a WhatsApp: el bot rechaza a quien todavía no está suscrito. */}
        <a
          href="#elige-tu-plan"
          className="hero-cta relative z-20 mx-auto flex min-h-14 w-full max-w-[590px] items-center justify-between rounded-full px-6 py-3 text-left font-medium text-[var(--silente-night)] transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)] active:scale-[.99] lg:-mt-8 lg:min-h-16 lg:py-4"
        >
          <span className="flex items-center gap-3">
            <WhatsAppIcon />
            <span>{copy.cta}</span>
          </span>
          <span className="text-2xl" aria-hidden="true">→</span>
        </a>

        <ul className="mx-auto mt-8 grid w-full max-w-[780px] grid-cols-3 sm:mt-10">
          {copy.beneficios.map((label, n) => (
            <li
              key={n}
              className={`flex min-h-28 flex-col items-center justify-center gap-2 px-1.5 text-center text-xs leading-[1.4] text-[var(--silente-muted)] sm:text-sm lg:text-base ${n > 0 ? "border-l border-[rgba(174,181,188,.4)]" : ""}`}
            >
              <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-[var(--silente-gold)] lg:h-9 lg:w-9">
                {ICONOS[n]}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
