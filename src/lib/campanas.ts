/**
 * Los límites de texto de una campaña, compartidos entre la validación del
 * servidor y el formulario del panel. Salen de la tarjeta de la portada: el
 * título cabe en dos líneas y la frase corta en tres. Una sola palabra más
 * larga que la tarjeta la deforma aunque el total quepa, por eso también se
 * acota la palabra.
 */
export const MAXIMO_TITULO = 60;
export const MAXIMO_RESUMEN = 140;
export const MAXIMO_PALABRA = 24;

export function sinPalabrasLargas(texto: string): boolean {
  return texto.split(/\s+/).every((palabra) => palabra.length <= MAXIMO_PALABRA);
}
