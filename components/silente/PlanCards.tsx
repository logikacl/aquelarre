// "Elige tu plan" (silente-web/components/Pricing.tsx), alimentado por la tabla `plans`.
// Con un plan, la tarjeta de Esteban junto al texto; con varios, una grilla de tarjetas.
import Link from "next/link";
import { bulletsVisibles } from "@/convex/planRules";
import { clp } from "@/lib/format";

export type PublicPlan = { slug: string; name: string; priceClp: number; dailyLimit: number; bullets: string[] };
export type PlanCopy = { eyebrow: string; titulo: string; parrafo: string; cta: string; nota: string };

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--silente-gold)]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

function Card({ plan, copy }: { plan: PublicPlan; copy: PlanCopy }) {
  return (
    <article className="plan-card relative overflow-hidden rounded-2xl border border-[rgba(213,170,75,.45)] bg-[var(--silente-secondary)] p-5 md:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--silente-gold)]" />
      <h3 className="text-2xl font-semibold text-[var(--silente-ivory)]">{plan.name}</h3>
      <div className="plan-price mt-6 border-y border-[var(--silente-border)] py-5 md:mt-8">
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-4xl font-semibold tracking-tight text-[var(--silente-ivory)] md:text-5xl">
          {clp(plan.priceClp).replace(" CLP", "")}{" "}
          <span className="whitespace-nowrap text-base font-normal text-[var(--silente-muted)]">CLP / mes</span>
        </p>
      </div>
      <ul className="mt-6 space-y-3 text-base leading-6 text-[var(--silente-ivory)]">
        {bulletsVisibles(plan).map((b) => (
          <li key={b} className="flex items-start gap-3"><Check /><span>{b}</span></li>
        ))}
      </ul>
      <Link
        href={`/checkout?plan=${encodeURIComponent(plan.slug)}`}
        className="mt-6 flex min-h-14 items-center justify-between rounded-full bg-[var(--silente-gold)] px-6 py-4 font-semibold text-[var(--silente-night)] transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--silente-gold-light)]"
      >
        <span>{copy.cta}</span>
        <span aria-hidden="true">→</span>
      </Link>
      <p className="mt-4 text-xs leading-5 text-[var(--silente-muted)]">{copy.nota}</p>
    </article>
  );
}

export default function PlanCards({ plans, copy }: { plans: PublicPlan[]; copy: PlanCopy }) {
  const uno = plans.length <= 1;
  return (
    <section id="elige-tu-plan" className="relative overflow-hidden px-5 py-12 md:px-8 md:py-16">
      <div className={`mx-auto grid w-full items-center gap-10 ${uno ? "max-w-5xl md:grid-cols-[.9fr_1.1fr] md:gap-8 lg:gap-16" : "max-w-6xl"}`}>
        <div className={uno ? "text-center md:text-left" : "text-center"}>
          <p className="text-sm uppercase tracking-[.22em] text-[var(--silente-gold)]">{copy.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-.03em] text-[var(--silente-ivory)] md:text-5xl lg:text-6xl">
            {copy.titulo}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--silente-muted)]">{copy.parrafo}</p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-[var(--silente-muted)]">Pronto abriremos las suscripciones.</p>
        ) : uno ? (
          <div className="mx-auto w-full max-w-lg"><Card plan={plans[0]} copy={copy} /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => <Card key={p.slug} plan={p} copy={copy} />)}
          </div>
        )}
      </div>
    </section>
  );
}
