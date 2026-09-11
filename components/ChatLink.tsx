// Un solo lugar arma el deep-link al chat. Lo usan /suscripcion/listo (justo después de
// pagar) y /cuenta (la vuelta, cuando la activación llegó tarde y el cliente ya se había
// ido): lo que se duplicaría entre las dos es el número del bot y la forma del texto
// prellenado, que es justo donde se esconde el bug.
//
// El canal es WhatsApp: es donde está la gente en Chile. El backend sigue soportando
// Telegram para quien ya lo enlazó, pero a los nuevos no se les ofrece — una opción de más
// en el momento del enganche es gente que duda y se va.
// `numero` llega como prop desde la página (server component) y no de `process.env` acá:
// la variable se llama NEXT_WHATSAPP_NUMBER, sin el prefijo NEXT_PUBLIC_, así que solo
// existe en el servidor. Leerla desde el cliente daría `undefined` sin romper el build.
export default function ChatLink({
  linkToken,
  chatId,
  numero,
}: {
  linkToken: string | null;
  chatId: number | null;
  numero: string;
}) {
  if (chatId) {
    return (
      <p className="text-on-surface-variant">
        Tu chat ya está conectado. Ábrelo en WhatsApp y escríbele a tu oráculo.
      </p>
    );
  }
  if (!linkToken) {
    return <p className="text-on-surface-variant">Tu chat ya fue enlazado. Ábrelo en WhatsApp.</p>;
  }
  // El texto va prellenado: el cliente solo aprieta enviar. `/start <token>` es lo que
  // `parseStartToken` espera, y es el que amarra este pago a ese chat.
  const texto = encodeURIComponent(`/start ${linkToken}`);
  return (
    <a
      href={`https://wa.me/${numero}?text=${texto}`}
      className="inline-block px-8 py-4 rounded-xl bg-primary text-on-primary font-bold"
    >
      Abrir mi chat en WhatsApp
    </a>
  );
}
