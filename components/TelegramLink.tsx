// Un solo lugar arma el deep-link. Lo usan /suscripcion/listo (justo después de pagar) y
// /cuenta (la vuelta, cuando la activación llegó tarde y el cliente ya se había ido): lo que
// se duplicaría entre las dos es el username del bot y la forma `?start=<token>`, que es
// justo donde se esconde el bug.
export default function TelegramLink({
  linkToken,
  chatId,
}: {
  linkToken: string | null;
  chatId: number | null;
}) {
  if (chatId) {
    return (
      <p className="text-on-surface-variant">
        Tu chat ya está conectado. Ábrelo en Telegram y escríbele a tu oráculo.
      </p>
    );
  }
  if (!linkToken) {
    return <p className="text-on-surface-variant">Tu chat ya fue enlazado. Ábrelo en Telegram.</p>;
  }
  return (
    <a
      href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${linkToken}`}
      className="inline-block px-8 py-4 rounded-xl bg-primary text-on-primary font-bold"
    >
      Abrir mi chat en Telegram
    </a>
  );
}
