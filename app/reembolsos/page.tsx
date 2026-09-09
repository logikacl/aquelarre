import { LegalDoc, REEMBOLSOS } from "@/lib/legal";

export const metadata = { title: "Política de Reembolso · Astros x Chat" };

export default function Reembolsos() {
  return <LegalDoc doc={REEMBOLSOS} />;
}
