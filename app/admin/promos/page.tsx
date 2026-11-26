import { backendPost } from "@/lib/backend";
import { fechaHoraCL } from "@/lib/format";

// El layout de /admin ya declara force-dynamic.

export type PromosReporte = {
  optins: { chatId: number; version: string; at: number }[];
  embudo: { day: string; clics: number; chats: number }[];
};

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="bg-surface-container rounded-xl p-5">
      <div className="text-sm text-on-surface-variant">{titulo}</div>
      <div className="text-3xl font-headline font-bold mt-1">{valor}</div>
      {nota && <div className="text-xs text-on-surface-variant mt-1">{nota}</div>}
    </div>
  );
}

export default async function Promos() {
  const { optins, embudo } = await backendPost<PromosReporte>("/api/admin/promos", {}, "admin");
  const clics = embudo.reduce((s, d) => s + d.clics, 0);
  const chats = embudo.reduce((s, d) => s + d.chats, 0);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tarjeta titulo="Aceptan promociones" valor={String(optins.length)} nota="Botón «Quiero novedades»" />
        <Tarjeta titulo="Clics al WhatsApp (30 días)" valor={String(clics)} nota="Botón del home" />
        <Tarjeta titulo="Chats nuevos (30 días)" valor={String(chats)} nota="Primer mensaje al bot" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-headline font-bold">Lista para campañas</h2>
          <a
            href="/admin/promos/reporte"
            className="px-4 py-2 rounded-full bg-primary text-on-primary font-semibold text-sm"
          >
            Descargar CSV
          </a>
        </div>
        <p className="text-sm text-on-surface-variant">
          Solo quienes aceptaron en el chat. Fuera de las 24 h desde su último mensaje, WhatsApp exige una
          plantilla de marketing aprobada por Meta. Quien escribe «BAJA» sale de la lista al instante.
        </p>
        {optins.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-on-surface-variant">
              <tr><th className="py-2">WhatsApp</th><th>Aceptó</th></tr>
            </thead>
            <tbody>
              {optins.slice().sort((a, b) => b.at - a.at).map((o) => (
                <tr key={o.chatId} className="border-t border-outline/20">
                  <td className="py-2">+{o.chatId}</td>
                  <td>{fechaHoraCL(o.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-headline font-bold">Embudo diario</h2>
        <p className="text-sm text-on-surface-variant">
          Los chats nuevos incluyen a quien llega por otros caminos (por ejemplo, después de pagar), así que pueden
          superar a los clics.
        </p>
        <table className="w-full text-sm">
          <thead className="text-left text-on-surface-variant">
            <tr><th className="py-2">Día</th><th>Clics</th><th>Chats nuevos</th></tr>
          </thead>
          <tbody>
            {embudo.map((d) => (
              <tr key={d.day} className="border-t border-outline/20">
                <td className="py-2">{d.day}</td><td>{d.clics}</td><td>{d.chats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
