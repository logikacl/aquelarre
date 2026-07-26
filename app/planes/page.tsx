import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { getCopy } from "@/lib/content";
import { clp } from "@/lib/format";

type PublicData = { priceClp: number };

export default async function Planes() {
  const { priceClp } = await backendGet<PublicData>("/api/public/oracles");
  const t = await getCopy();

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter mb-6 text-on-surface">
          {t("planes.hero.titulo1")} <span className="text-primary italic">{t("planes.hero.titulo2")}</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t("planes.hero.parrafo")}</p>
      </section>

      <section className="max-w-md mx-auto bg-surface-container p-10 rounded-[2.5rem] flex flex-col border border-primary/40 mb-24">
        <div className="mb-8">
          <span className="text-primary font-bold uppercase tracking-widest text-xs">{t("planes.plan.etiqueta")}</span>
          <h2 className="text-3xl font-bold mt-2">{t("planes.plan.nombre")}</h2>
        </div>
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-4xl font-bold">{clp(priceClp)}</span>
          <span className="text-on-surface-variant">{t("planes.plan.periodo")}</span>
        </div>
        <ul className="space-y-4 mb-10 flex-grow">
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>{t("planes.plan.bullet.1")}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>{t("planes.plan.bullet.2")}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>{t("planes.plan.bullet.3")}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">✓</span>
            <span>{t("planes.plan.bullet.4")}</span>
          </li>
        </ul>
        <Link
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-center hover:opacity-90 transition-all"
          href="/checkout"
        >
          {t("planes.plan.cta")}
        </Link>
      </section>

      <section>
        <h2 className="text-3xl font-headline font-bold text-center mb-12 text-on-surface">
          {t("planes.incluye.titulo")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">{t("planes.incluye.1.emoji")}</span>
            <div>
              <h3 className="font-bold text-lg mb-1">{t("planes.incluye.1.titulo")}</h3>
              <p className="text-on-surface-variant text-sm">{t("planes.incluye.1.texto")}</p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">{t("planes.incluye.2.emoji")}</span>
            <div>
              <h3 className="font-bold text-lg mb-1">{t("planes.incluye.2.titulo")}</h3>
              <p className="text-on-surface-variant text-sm">{t("planes.incluye.2.texto")}</p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">{t("planes.incluye.3.emoji")}</span>
            <div>
              <h3 className="font-bold text-lg mb-1">{t("planes.incluye.3.titulo")}</h3>
              <p className="text-on-surface-variant text-sm">{t("planes.incluye.3.texto")}</p>
            </div>
          </div>
          <div className="bg-surface-container p-8 rounded-3xl flex items-center gap-6 border border-primary/10 hover:border-primary/40 transition-all duration-500">
            <span className="text-primary text-3xl">{t("planes.incluye.4.emoji")}</span>
            <div>
              <h3 className="font-bold text-lg mb-1">{t("planes.incluye.4.titulo")}</h3>
              <p className="text-on-surface-variant text-sm">{t("planes.incluye.4.texto")}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
