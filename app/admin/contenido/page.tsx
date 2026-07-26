import { backendPost } from "@/lib/backend";
import ContentEditor from "@/components/ContentEditor";

export default async function AdminContenido() {
  // Solo llegan las claves sobrescritas; el resto lo pone COPY_GROUPS desde el código.
  const overrides = await backendPost<Record<string, string>>("/api/admin/content", {}, "admin");
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold">Contenido</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Los campos sin editar muestran el texto por defecto del sitio. Guardar es por campo.
        </p>
      </div>
      <ContentEditor overrides={overrides} />
    </section>
  );
}
