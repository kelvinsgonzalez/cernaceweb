/**
 * Serie de códigos de expediente: EXP-<año>-<0000>.
 *
 * Se calcula sobre los códigos que ya existen en vez de llevar un contador en
 * la base: los expedientes viejos entraron con su número de papel y la serie
 * tiene que continuar desde el mayor, no desde cuántos hay.
 *
 * Es una sugerencia para el formulario, no una reserva: quien inscribe puede
 * cambiarlo, y la unicidad la garantiza la restricción de la base.
 */
export function siguienteCodigo(codigos: string[]): string {
  const mayor = codigos.reduce((maximo, codigo) => {
    const numero = /^EXP-\d{4}-(\d+)$/.exec(codigo)?.[1];
    return numero ? Math.max(maximo, Number(numero)) : maximo;
  }, 0);
  return `EXP-${new Date().getUTCFullYear()}-${String(mayor + 1).padStart(4, "0")}`;
}
