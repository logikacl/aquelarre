import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ConsentClient from "@/components/ConsentClient";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });

export const metadata: Metadata = {
  title: "Silente",
  description: "Hay cosas que necesitas saber. Hay cosas que necesitas hablar. Conversa con Luna por WhatsApp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121B26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={syne.variable}>
      <body className="bg-background text-on-surface font-body">
        <ConsentClient>
          <Nav />
          {children}
          <Footer />
        </ConsentClient>
      </body>
    </html>
  );
}
