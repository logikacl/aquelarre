import { LegalDoc, PRIVACIDAD } from "@/lib/legal";

export const metadata = { title: "Política de Privacidad · Astros x Chat" };

export default function Privacidad() {
  return <LegalDoc doc={PRIVACIDAD} />;
}
