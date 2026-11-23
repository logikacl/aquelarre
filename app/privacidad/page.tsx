import { LegalDoc, PRIVACIDAD } from "@/lib/legal";

export const metadata = { title: "Política de Privacidad · Silente" };

export default function Privacidad() {
  return <LegalDoc doc={PRIVACIDAD} />;
}
