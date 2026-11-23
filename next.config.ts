import type { NextConfig } from "next";

// /planes y /oraculos/<slug> existían antes del diseño de Silente: los planes viven en la
// home y hay una sola guía, Luna. Se redirigen para no romper enlaces ya compartidos.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/planes", destination: "/#elige-tu-plan", permanent: true },
      { source: "/oraculos/:slug", destination: "/", permanent: true },
    ];
  },
};
export default nextConfig;
