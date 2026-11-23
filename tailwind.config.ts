import type { Config } from "tailwindcss";

export default {
  // consent/ va incluido aunque no sea "código de la app": el banner de cookies vive ahí, y
  // sin escanearlo Tailwind no genera sus clases de posición — el diálogo se cae al final
  // del documento y nadie puede aceptar ni rechazar.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./consent/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Paleta Silente (diseño de Esteban: azul noche + dorado). Conserva los nombres de los
      // tokens del tema anterior a propósito: así las páginas que no se rediseñaron (cuenta,
      // admin, formularios) se re-pintan sin tocar su JSX. Los colores de marca también
      // existen como variables --silente-* en globals.css, que usan los componentes portados.
      colors: {
        background: "#121B26",
        surface: "#121B26",
        "surface-bright": "#1D2A3A",
        "surface-dim": "#0B131C",
        "surface-tint": "#D5AA4B",
        "surface-variant": "#1D2A3A",
        "surface-container-lowest": "#0B131C",
        "surface-container-low": "#141F2B",
        "surface-container": "#172331",
        "surface-container-high": "#1D2A3A",
        "surface-container-highest": "#233244",
        "on-surface": "#F3EBDD",
        "on-background": "#F3EBDD",
        "on-surface-variant": "#C0C4C7",
        "inverse-surface": "#F3EBDD",
        "inverse-on-surface": "#121B26",
        "inverse-primary": "#8A6A22",
        outline: "#5A6B7D",
        "outline-variant": "#293746",
        primary: "#D5AA4B",
        "primary-container": "#E5C46A",
        "primary-fixed": "#F6E3B4",
        "primary-fixed-dim": "#E5C46A",
        "on-primary": "#121B26",
        "on-primary-container": "#121B26",
        "on-primary-fixed": "#121B26",
        "on-primary-fixed-variant": "#3A2C0C",
        secondary: "#C0C4C7",
        "secondary-container": "#293746",
        "secondary-fixed": "#DDE1E4",
        "secondary-fixed-dim": "#C0C4C7",
        "on-secondary": "#121B26",
        "on-secondary-container": "#F3EBDD",
        "on-secondary-fixed": "#121B26",
        "on-secondary-fixed-variant": "#293746",
        tertiary: "#E8A0A0",
        "tertiary-container": "#5A2A2A",
        "tertiary-fixed": "#FCE0E0",
        "tertiary-fixed-dim": "#E8A0A0",
        "on-tertiary": "#121B26",
        "on-tertiary-container": "#FCE0E0",
        "on-tertiary-fixed": "#2E1515",
        "on-tertiary-fixed-variant": "#6E3030",
        error: "#F08A7A",
        "error-container": "#4A1F1A",
        "on-error": "#121B26",
        "on-error-container": "#FCE4E0",
      },
      fontFamily: {
        // Syne es la tipografía de todo el sistema Silente.
        headline: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-syne)", "sans-serif"],
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    },
  },
  plugins: [],
} satisfies Config;
