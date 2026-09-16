// El acceso al chat, en /suscripcion/listo (justo después de pagar) y en /cuenta (la vuelta).
//
// La suscripción se enlaza por el número de WhatsApp de la cuenta: cuando ese número le
// escribe al bot, queda conectada (subscriptions.activaOVincula). Por eso el botón abre el
// chat con un simple "Hola": no lleva código que se pueda borrar o dañar sin querer.
//
// `numeroBot` llega como prop desde la página y no de process.env acá: la variable se llama
// NEXT_WHATSAPP_NUMBER, sin el prefijo NEXT_PUBLIC_, y solo existe en el servidor.
import { formatearTelefono } from "@/convex/telefono";
import PhoneInput from "@/components/PhoneInput";
import { guardarTelefono } from "@/app/cuenta/actions";

const inputClass =
  "w-full bg-background border border-outline/30 rounded-lg py-3 px-4 focus:border-primary focus:ring-0 transition-all text-on-surface";

function FormNumero({ volver, actual }: { volver: string; actual: number | null }) {
  return (
    <form action={guardarTelefono} className="space-y-2 text-left">
      <input name="volver" type="hidden" value={volver} />
      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="telefono">
        Tu WhatsApp
      </label>
      <PhoneInput className={inputClass} defaultValue={actual ? formatearTelefono(actual) : ""} />
      <button className="px-6 py-3 rounded-xl border border-primary text-primary font-bold" type="submit">
        Guardar número
      </button>
    </form>
  );
}

export default function ChatLink({
  chatId,
  phone,
  numeroBot,
  volver,
}: {
  chatId: number | null;
  phone: number | null;
  numeroBot: string;
  volver: "/cuenta" | "/suscripcion/listo";
}) {
  // Sin número registrado (cuentas de antes de que se pidiera): lo primero es pedirlo.
  if (!phone && !chatId) {
    return (
      <div className="space-y-4">
        <p className="text-on-surface-variant">
          Registra el número de WhatsApp desde el que vas a conversar con el oráculo.
        </p>
        <FormNumero actual={null} volver={volver} />
      </div>
    );
  }

  const abrir = (
    <a
      className="inline-block px-8 py-4 rounded-xl bg-primary text-on-primary font-bold"
      href={`https://wa.me/${numeroBot}?text=${encodeURIComponent("Hola 👋")}`}
    >
      Abrir mi chat en WhatsApp
    </a>
  );

  return (
    <div className="space-y-4">
      {chatId ? (
        <p className="text-on-surface-variant">
          Tu chat está conectado con <strong className="text-on-surface">{formatearTelefono(chatId)}</strong>.
          {phone && phone !== chatId && (
            <>
              {" "}
              Registraste {formatearTelefono(phone)}: la suscripción se pasa a ese número en cuanto le escribas
              desde ahí.
            </>
          )}
        </p>
      ) : (
        <p className="text-on-surface-variant">
          Escríbele al oráculo desde <strong className="text-on-surface">{formatearTelefono(phone!)}</strong>: tu
          suscripción se conecta sola con tu primer mensaje.
        </p>
      )}
      {abrir}
      <details className="text-sm">
        <summary className="cursor-pointer text-on-surface-variant underline">¿Otro número? Cámbialo aquí</summary>
        <div className="mt-4">
          <FormNumero actual={phone} volver={volver} />
        </div>
      </details>
    </div>
  );
}
