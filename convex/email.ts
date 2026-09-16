// Correo transaccional vía Resend (el proveedor del marketplace de Vercel, y el que ya usa
// ARHouse). Fetch directo, sin SDK, igual que whatsapp.ts y reveniu.ts.
//
// EMAIL_FROM tiene que ser de un dominio verificado en Resend (silente.cl, registros DNS en
// Cloudflare). Sin eso Resend solo entrega al dueño de la cuenta, desde onboarding@resend.dev.
export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, ...opts }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
