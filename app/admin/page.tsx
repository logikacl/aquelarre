import { backendPost } from "@/lib/backend";
import PriceEditor from "@/components/PriceEditor";

export default async function Admin() {
  const config = await backendPost<{ priceClp: number; reason: string }>("/api/admin/config", {}, "admin");
  return (
    <section>
      <h2 className="text-2xl font-headline font-bold mb-6">Precio</h2>
      <PriceEditor current={config.priceClp} />
    </section>
  );
}
