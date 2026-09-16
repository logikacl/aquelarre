// Número de WhatsApp: de lo que la persona escribe al formato con que WhatsApp nos identifica
// el chat (el wa_id: E.164 sin "+"). Un solo lugar, lo usan el formulario, la web y Convex.
//
// El número guardado se compara tal cual contra el chatId de los mensajes entrantes, así que
// tiene que quedar exactamente como lo manda WhatsApp.

// Chile por defecto: la gente escribe su celular sin el código de país.
//   "9 7864 4790", "978644790", "+56 9 7864 4790", "56978644790" → 56978644790
// Otro país solo con "+" explícito, para no adivinar a qué país pertenecen 9 dígitos.
// ponytail: en algunos países el wa_id no calza con el número marcado (México agrega un 1,
// Argentina un 9). Si aparecen clientes de allá, normalizar por país; hoy la audiencia es Chile.
export function normalizarTelefono(entrada: string): number | null {
  const conMas = entrada.trim().startsWith("+");
  const d = entrada.replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("9")) return Number(`56${d}`);
  if (d.length === 11 && d.startsWith("569")) return Number(d);
  if (conMas && !d.startsWith("56") && d.length >= 8 && d.length <= 15 && !d.startsWith("0")) return Number(d);
  return null;
}

// 56978644790 → "+56 9 7864 4790". Fuera de Chile, sin agrupar.
export function formatearTelefono(n: number): string {
  const d = String(n);
  if (d.length === 11 && d.startsWith("569")) return `+56 9 ${d.slice(3, 7)} ${d.slice(7)}`;
  return `+${d}`;
}
