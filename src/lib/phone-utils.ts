/**
 * Normaliza un número de teléfono a formato canónico NUMÉRICO PURO.
 * Elimina +, espacios, guiones, paréntesis y cualquier caracter no dígito.
 *
 * @example
 *   normalizePhone("+54 9 3704 868421")  // → "5493704868421"
 *   normalizePhone("+5493704868421")     // → "5493704868421"
 *   normalizePhone("11-4123-4567")       // → "1141234567"
 *   normalizePhone("+54 (11) 4123-4567") // → "541141234567"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Valida que un teléfono normalizado tenga formato argentino válido
 * (empieza con 549 y tiene entre 10 y 13 dígitos).
 *
 * @example
 *   isValidPhone("5493704868421")  // → true
 *   isValidPhone("1141234567")     // → false
 */
export function isValidPhone(phone: string): boolean {
  return /^549\d{7,11}$/.test(phone);
}
