// Reglas de contraseña. Un solo lugar: lo usan el formulario (aviso en vivo), la server action
// y el endpoint de registro de Convex — este último es el que manda, los otros dos son para
// que la persona no descubra el problema después de apretar el botón.
//
// No se exige símbolo a propósito: obliga a trucos predecibles ("Clave2026!") sin sumar
// seguridad real. El largo pesa más que la variedad, y el gestor de contraseñas del navegador
// (autocomplete="new-password") genera claves que cumplen todo.

export const PASSWORD_MIN = 10;
// Tope: PBKDF2 sobre un input de megas es CPU gratis para quien quiera tumbar el registro.
export const PASSWORD_MAX = 128;

export function reglasPassword(pw: string, email = "") {
  const usuario = email.split("@")[0].toLowerCase();
  return [
    { ok: pw.length >= PASSWORD_MIN && pw.length <= PASSWORD_MAX, texto: `Al menos ${PASSWORD_MIN} caracteres` },
    // "Cambia al pasarla a minúscula" y no [A-Z]: una Ñ o una Á también son mayúscula, y no
    // depende de que el navegador soporte \p{Lu} (el proyecto compila a ES2017).
    { ok: pw !== pw.toLowerCase() && pw !== pw.toUpperCase(), texto: "Mayúsculas y minúsculas" },
    { ok: /\d/.test(pw), texto: "Al menos un número" },
    // Con menos de 4 letras el usuario del correo aparece por azar ("ana" en "banana").
    { ok: usuario.length < 4 || !pw.toLowerCase().includes(usuario), texto: "Que no contenga tu correo" },
  ];
}

export const passwordValida = (pw: string, email = "") => reglasPassword(pw, email).every((r) => r.ok);
