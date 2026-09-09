import { LegalDoc, TERMINOS } from "@/lib/legal";

export const metadata = { title: "Términos y Condiciones · Astros x Chat" };

export default function Terminos() {
  return <LegalDoc doc={TERMINOS} />;
}
