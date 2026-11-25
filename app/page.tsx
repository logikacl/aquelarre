import { backendGet } from "@/lib/backend";
import { getCopy } from "@/lib/content";
import { encendido } from "@/lib/copy";
import Hero from "@/components/silente/Hero";
import WhatIs from "@/components/silente/WhatIs";
import PlanCards, { type PublicPlan } from "@/components/silente/PlanCards";
import Faq from "@/components/silente/Faq";
import Testimonials from "@/components/silente/Testimonials";

// Home de Silente (diseño de Esteban). El texto sale del CMS (lib/copy.ts + overrides) y los
// planes de la tabla `plans`.
export default async function Home() {
  const [plans, t] = await Promise.all([backendGet<PublicPlan[]>("/api/public/plans"), getCopy()]);
  const n = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => t(`${prefix}.${i + 1}`));

  return (
    <main className="silente-home">
      <Hero
        numeroBot={process.env.NEXT_WHATSAPP_NUMBER ?? ""}
        copy={{
          titulo: t("home.hero.titulo"),
          palabras: [t("home.hero.palabra1"), t("home.hero.palabra2")],
          frases: [t("home.hero.frase1"), t("home.hero.frase2")],
          intro: t("home.hero.intro"),
          preguntas: n("home.hero.pregunta", 6),
          cta: t("home.hero.cta"),
          beneficios: n("home.hero.beneficio", 3) as [string, string, string],
        }}
      />
      <WhatIs
        copy={{
          eyebrow: t("home.quees.eyebrow"),
          titulo: t("home.quees.titulo"),
          parrafos: [t("home.quees.parrafo1"), t("home.quees.parrafo2")],
          videoEyebrow: t("home.quees.video.eyebrow"),
          videoUrl: t("home.quees.video.url"),
          videoTitulo: t("home.quees.video.titulo"),
          videoSub: t("home.quees.video.sub"),
        }}
      />
      <PlanCards
        plans={plans}
        copy={{
          eyebrow: t("home.plan.eyebrow"),
          titulo: t("home.plan.titulo"),
          parrafo: t("home.plan.parrafo"),
          cta: t("home.plan.cta"),
          nota: t("home.plan.nota"),
        }}
      />
      <Faq
        copy={{
          eyebrow: t("home.faq.eyebrow"),
          titulo: t("home.faq.titulo"),
          parrafo: t("home.faq.parrafo"),
          items: [1, 2, 3, 4].map((i) => ({ pregunta: t(`home.faq.${i}.pregunta`), respuesta: t(`home.faq.${i}.respuesta`) })),
        }}
      />
      {encendido(t("home.testimonios.mostrar")) && (
        <Testimonials
          copy={{
            eyebrow: t("home.testimonios.eyebrow"),
            titulo: t("home.testimonios.titulo"),
            items: [1, 2, 3, 4].map((i) => ({
              nombre: t(`home.testimonios.${i}.nombre`),
              foto: t(`home.testimonios.${i}.foto`),
              cita: t(`home.testimonios.${i}.cita`),
            })),
          }}
        />
      )}
    </main>
  );
}
