// "Qué es Silente" (silente-web/app/page.tsx, WhatIsSilenteSection). Con URL de video en el
// CMS muestra el video; sin ella, el espacio reservado del diseño original.
export type WhatIsCopy = {
  eyebrow: string;
  titulo: string;
  parrafos: [string, string];
  videoEyebrow: string;
  videoUrl: string;
  videoTitulo: string;
  videoSub: string;
};

export default function WhatIs({ copy }: { copy: WhatIsCopy }) {
  return (
    <section id="como-funciona" className="bg-[var(--silente-secondary)] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[.22em] text-[var(--silente-gold)]">{copy.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-.03em] text-[var(--silente-ivory)] md:text-6xl">
            {copy.titulo}
          </h2>
          {copy.parrafos.map((p, i) => (
            <p key={i} className={`${i === 0 ? "mt-6" : "mt-5"} text-base leading-7 text-[var(--silente-muted)] md:text-lg`}>
              {p}
            </p>
          ))}
        </div>

        <div>
          <p className="mb-5 text-sm uppercase tracking-[.22em] text-[var(--silente-gold)]">{copy.videoEyebrow}</p>
          {copy.videoUrl ? (
            <video
              controls
              playsInline
              preload="metadata"
              src={copy.videoUrl}
              className="aspect-video w-full overflow-hidden rounded-3xl border border-[rgba(213,170,75,.24)] bg-black"
            />
          ) : (
            <div
              role="img"
              aria-label={`${copy.videoTitulo}. ${copy.videoSub}`}
              className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl border border-[rgba(213,170,75,.24)] bg-[radial-gradient(ellipse_at_center,rgba(213,170,75,.12),transparent_58%),rgba(5,14,22,.72)] px-6 text-center"
            >
              <div>
                <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(213,170,75,.5)] text-2xl text-[var(--silente-gold-light)]">▶</span>
                <p className="mt-5 text-lg text-[var(--silente-ivory)] md:text-xl">{copy.videoTitulo}</p>
                <p className="mt-2 text-sm text-[var(--silente-muted)]">{copy.videoSub}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
