// Coordenadas de ciudades chilenas para el ascendente — sin geocoding externo.
// ponytail: principales ciudades. Agregar entradas si aparecen lugares no cubiertos.
// Zona horaria continental = America/Santiago (Isla de Pascua queda fuera).
const CIUDADES: Record<string, { lat: number; lon: number }> = {
  "santiago": { lat: -33.45, lon: -70.66 },
  "valparaiso": { lat: -33.05, lon: -71.62 },
  "vina del mar": { lat: -33.02, lon: -71.55 },
  "concepcion": { lat: -36.83, lon: -73.05 },
  "talcahuano": { lat: -36.72, lon: -73.12 },
  "antofagasta": { lat: -23.65, lon: -70.4 },
  "calama": { lat: -22.46, lon: -68.93 },
  "iquique": { lat: -20.21, lon: -70.15 },
  "arica": { lat: -18.48, lon: -70.31 },
  "la serena": { lat: -29.9, lon: -71.25 },
  "coquimbo": { lat: -29.95, lon: -71.34 },
  "copiapo": { lat: -27.37, lon: -70.33 },
  "rancagua": { lat: -34.17, lon: -70.74 },
  "curico": { lat: -34.98, lon: -71.24 },
  "talca": { lat: -35.43, lon: -71.65 },
  "chillan": { lat: -36.61, lon: -72.1 },
  "los angeles": { lat: -37.47, lon: -72.35 },
  "temuco": { lat: -38.74, lon: -72.6 },
  "valdivia": { lat: -39.81, lon: -73.24 },
  "osorno": { lat: -40.57, lon: -73.13 },
  "puerto montt": { lat: -41.47, lon: -72.94 },
  "coyhaique": { lat: -45.57, lon: -72.07 },
  "punta arenas": { lat: -53.16, lon: -70.91 },
};

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Busca la ciudad como subcadena del texto (ej. "Santiago, 22 de marzo de 1977").
// Devuelve el nombre canónico para guardarlo y re-buscarlo al confeccionar la carta.
export function buscarCiudad(text: string): { name: string; lat: number; lon: number } | null {
  const p = norm(text);
  for (const [nombre, coords] of Object.entries(CIUDADES)) {
    if (p.includes(nombre)) return { name: nombre, ...coords };
  }
  return null;
}
