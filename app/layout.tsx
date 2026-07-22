import type { Metadata } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Astros x Chat | Tu destino escrito en las estrellas",
  description: "Conversa en privado con un oráculo astrólogo por Telegram. Suscripción mensual.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${garamond.variable} ${manrope.variable}`}>
      <body className="bg-background text-on-surface font-body">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
