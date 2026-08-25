// Recalcula `intensidad` en transito_casa.json.
//
// El valor original era funcion pura del numero de casa — identico para los 10
// planetas — asi que la Luna en casa 1 (unas horas) puntuaba 5 y Pluton en casa 12
// (hasta 30 anios) puntuaba 2. Cualquier seleccion ordenada por ese campo prefiere
// lo trivial sobre lo estructural.
//
// Modelo nuevo: cuanto dura el transito manda, la casa modula.
//   intensidad = clamp(pesoPlaneta + modCasa, 1, 5)
//
// ponytail: dos tablas y una suma. Techo conocido: ignora retrogradaciones (Marte
// puede estar 7 meses en una casa en vez de 2) y usa casas por signos enteros, que
// son las que va a calcular el backend. Si algun dia hay cuspides reales y fechas de
// ingreso/egreso, esto se reemplaza por la duracion efectiva del transito concreto.
import { readFileSync, writeFileSync } from "node:fs";

// Duracion aproximada del paso por una casa de 30 grados.
const PESO = {
  luna: 1,      // ~2.5 dias
  mercurio: 2,  // ~2-3 semanas
  venus: 2,     // ~1 mes
  sol: 2,       // ~1 mes
  marte: 2,     // ~1.5-2 meses
  jupiter: 3,   // ~1 anio
  saturno: 4,   // ~2.5 anios
  urano: 4,     // ~7 anios
  neptuno: 5,   // ~14 anios
  pluton: 5,    // ~12-30 anios
};

// Angulares empujan a la accion; cadentes son de asimilacion. La casa 8 pierde el
// +1 que traia: con el peso del planeta ya en juego, Pluton o Neptuno ahi llegan
// a 5 por su cuenta, y la Luna no deberia.
const ANGULARES = [1, 4, 7, 10];
const CADENTES = [3, 6, 9, 12];
const modCasa = (casa) => (ANGULARES.includes(casa) ? 1 : CADENTES.includes(casa) ? -1 : 0);

export const intensidadCasa = (planeta, casa) => {
  const peso = PESO[planeta];
  if (!peso) throw new Error(`planeta desconocido: ${planeta}`);
  if (!(casa >= 1 && casa <= 12)) throw new Error(`casa fuera de rango: ${casa}`);
  return Math.min(5, Math.max(1, peso + modCasa(casa)));
};

const ruta = process.argv[2];
if (ruta) {
  const filas = JSON.parse(readFileSync(ruta, "utf8"));
  const antes = filas.map((r) => r.intensidad);
  for (const r of filas) r.intensidad = intensidadCasa(r.planeta, r.casa);
  writeFileSync(ruta, JSON.stringify(filas, null, 1) + "\n");

  const cambiados = filas.filter((r, i) => r.intensidad !== antes[i]).length;
  console.log(`${cambiados}/${filas.length} registros con intensidad nueva\n`);
  console.log("casa:      " + Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2)).join(" "));
  for (const p of Object.keys(PESO)) {
    const fila = Array.from({ length: 12 }, (_, i) => String(intensidadCasa(p, i + 1)).padStart(2));
    console.log(p.padEnd(10) + " " + fila.join(" "));
  }
}
