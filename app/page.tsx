import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { getCopy } from "@/lib/content";
import { clp } from "@/lib/format";

type PublicData = {
  oracles: { slug: string; name: string; specialty: string | null; bio: string | null; photoUrl: string | null }[];
  priceClp: number;
};

export default async function Home() {
  const { oracles, priceClp } = await backendGet<PublicData>("/api/public/oracles");
  const t = await getCopy();

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-40"
            src={t("home.hero.imagen")}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container mb-8 border border-primary/20">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">{t("home.hero.badge")}</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold font-headline mb-6 tracking-tighter text-on-surface">
            {t("home.hero.titulo1")}
            <br />
            <span className="text-primary italic">{t("home.hero.titulo2")}</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("home.hero.parrafo")}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              className="px-8 py-4 rounded-xl bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              href="/checkout"
            >
              {t("home.hero.cta1")}
            </Link>
            <a
              className="px-8 py-4 rounded-xl bg-surface-container border border-primary/20 text-on-surface font-bold text-lg hover:bg-primary/10 transition-all"
              href="#como-funciona"
            >
              {t("home.hero.cta2")}
            </a>
          </div>
        </div>
      </section>

      {/* Cómo funciona (Bento) */}
      <section className="py-24 container mx-auto px-6" id="como-funciona">
        <div className="mb-16 text-center">
          <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{t("home.proceso.eyebrow")}</h2>
          <h3 className="text-4xl md:text-5xl font-headline font-bold">{t("home.proceso.titulo")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container p-8 rounded-3xl flex flex-col justify-between border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <div className="max-w-md">
              <span className="text-primary font-bold text-5xl opacity-20">{t("home.proceso.1.numero")}</span>
              <h4 className="text-2xl font-bold mt-4 mb-2">{t("home.proceso.1.titulo")}</h4>
              <p className="text-on-surface-variant">{t("home.proceso.1.texto")}</p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary font-bold text-5xl opacity-20">{t("home.proceso.2.numero")}</span>
            <h4 className="text-2xl font-bold mt-4 mb-2">{t("home.proceso.2.titulo")}</h4>
            <p className="text-on-surface-variant mb-6">{t("home.proceso.2.texto")}</p>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary font-bold text-5xl opacity-20">{t("home.proceso.3.numero")}</span>
            <h4 className="text-2xl font-bold mt-4 mb-2">{t("home.proceso.3.titulo")}</h4>
            <p className="text-on-surface-variant">{t("home.proceso.3.texto")}</p>
          </div>
          <div className="md:col-span-2 bg-surface-container p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <div className="flex-1">
              <span className="text-primary font-bold text-5xl opacity-20">{t("home.proceso.4.numero")}</span>
              <h4 className="text-2xl font-bold mt-4 mb-2">{t("home.proceso.4.titulo")}</h4>
              <p className="text-on-surface-variant">{t("home.proceso.4.texto")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Astrólogos */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">
                {t("home.astrologos.eyebrow")}
              </h2>
              <h3 className="text-4xl md:text-6xl font-headline font-bold">{t("home.astrologos.titulo")}</h3>
            </div>
            <p className="max-w-md text-on-surface-variant leading-relaxed">{t("home.astrologos.parrafo")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {oracles.map((o) => (
              <Link className="group" href={`/oraculos/${o.slug}`} key={o.slug}>
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] mb-6 border border-primary/10">
                  {o.photoUrl ? (
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={o.photoUrl}
                      alt={o.name}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                  {o.specialty && (
                    <div className="absolute bottom-6 left-6">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                        {o.specialty}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-2xl font-bold mb-2">{o.name}</h4>
                {o.bio && <p className="text-on-surface-variant line-clamp-3">{o.bio}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-24 container mx-auto px-6" id="planes">
        <div className="text-center mb-16">
          <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{t("home.planes.eyebrow")}</h2>
          <h3 className="text-4xl md:text-5xl font-headline font-bold">{t("home.planes.titulo")}</h3>
        </div>
        <div className="max-w-md mx-auto bg-surface-container p-10 rounded-[2.5rem] flex flex-col border border-primary/40">
          <div className="mb-8">
            <span className="text-primary font-bold uppercase tracking-widest text-xs">{t("home.planes.etiqueta")}</span>
            <h4 className="text-3xl font-bold mt-2">{t("home.planes.nombre")}</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-4xl font-bold">{clp(priceClp)}</span>
            <span className="text-on-surface-variant">{t("home.planes.periodo")}</span>
          </div>
          <ul className="space-y-4 mb-10 flex-grow">
            <li className="flex items-center gap-3">
              <span className="text-primary">✓</span>
              <span>{t("home.planes.bullet.1")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary">✓</span>
              <span>{t("home.planes.bullet.2")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary">✓</span>
              <span>{t("home.planes.bullet.3")}</span>
            </li>
          </ul>
          <Link
            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-center hover:opacity-90 transition-all"
            href="/checkout"
          >
            {t("home.planes.cta")}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 container mx-auto px-6 max-w-4xl" id="faq">
        <div className="text-center mb-16">
          <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{t("home.faq.eyebrow")}</h2>
          <h3 className="text-4xl font-headline font-bold">{t("home.faq.titulo")}</h3>
        </div>
        <div className="space-y-4">
          <details className="group bg-surface-container rounded-2xl overflow-hidden cursor-pointer border border-primary/10">
            <summary className="p-6 flex justify-between items-center list-none font-bold text-lg hover:text-primary transition-colors">
              {t("home.faq.1.pregunta")}
              <span className="transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-6 pb-6 text-on-surface-variant">{t("home.faq.1.respuesta")}</div>
          </details>
          <details className="group bg-surface-container rounded-2xl overflow-hidden cursor-pointer border border-primary/10">
            <summary className="p-6 flex justify-between items-center list-none font-bold text-lg hover:text-primary transition-colors">
              {t("home.faq.2.pregunta")}
              <span className="transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-6 pb-6 text-on-surface-variant">{t("home.faq.2.respuesta")}</div>
          </details>
          <details className="group bg-surface-container rounded-2xl overflow-hidden cursor-pointer border border-primary/10">
            <summary className="p-6 flex justify-between items-center list-none font-bold text-lg hover:text-primary transition-colors">
              {t("home.faq.3.pregunta")}
              <span className="transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-6 pb-6 text-on-surface-variant">{t("home.faq.3.respuesta")}</div>
          </details>
        </div>
      </section>
    </main>
  );
}
