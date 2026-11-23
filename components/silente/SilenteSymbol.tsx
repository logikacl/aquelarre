// Aro dorado central del hero (silente-web/components/SilenteSymbol.tsx).
export default function SilenteSymbol() {
  return (
    <div
      role="img"
      aria-label="Aro dorado de luz en el centro del sistema orbital"
      className="silente-symbol relative aspect-square w-[min(30vw,180px)] lg:w-72"
    >
      <img src="/central-symbol.webp" alt="" className="absolute inset-0 h-full w-full object-contain opacity-80 mix-blend-screen" />
    </div>
  );
}
