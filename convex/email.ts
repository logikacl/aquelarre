// Correo transaccional vía la API de Brevo (Logika ya tiene cuenta ahí, y el mismo proveedor
// sirve después para campañas). Fetch directo, sin SDK, igual que whatsapp.ts y reveniu.ts.
//
// API y no SMTP: el runtime normal de Convex no abre sockets SMTP. Y la clave es la "API key"
// de Brevo, que es distinta de la "clave SMTP" del mismo panel — no son intercambiables.
//
// EMAIL_FROM tiene que pertenecer a un dominio autenticado en Brevo (silente.cl, registros DNS
// en Cloudflare).
//
// OJO, falla en silencio: con un remitente inválido la API responde 201 igual y Brevo
// rechaza el envío *después* (verificado el 2026-09-16). Este fetch no ve error y no queda
// nada en nuestros logs. Si "no me llega el correo", mirar los eventos de Brevo:
//   GET https://api.brevo.com/v3/smtp/statistics/events?tags=recuperar-clave&event=error
const REMITENTE = "Astros x Chat";

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string; tag: string }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: REMITENTE, email: process.env.EMAIL_FROM },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
      // Etiqueta para encontrar estos envíos en los logs de Brevo sin buscar por destinatario.
      tags: [opts.tag],
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}
