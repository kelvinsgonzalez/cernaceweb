/**
 * Fechas sin hora vs. marcas de tiempo.
 *
 * PostgreSQL guarda las columnas `@db.Date` a medianoche UTC. Guatemala es
 * UTC-6, así que formatearlas en zona local las corre al día anterior: una
 * fecha de nacimiento del 14/03 se mostraría como 13/03.
 *
 * Por eso hay dos funciones separadas:
 *  - `formatFecha` fuerza timeZone UTC y es la que se usa con fechas de
 *    calendario (nacimiento, ingreso, evaluaciones, avances…).
 *  - `formatFechaHora` usa la zona local y es la de `createdAt`/`updatedAt`.
 */

const ZONA_LOCAL = "America/Guatemala";

export function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatFechaLarga(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_LOCAL,
  }).format(d);
}

/** Edad en años cumplidos, calculada íntegramente en UTC. */
export function calcularEdad(fechaNacimiento: Date | string): number {
  const nacimiento =
    fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mes = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) {
    edad -= 1;
  }
  return edad;
}

/** Valor para un <input type="date">, en UTC para no correr el día. */
export function fechaParaInput(fecha: Date | string | null | undefined): string {
  if (!fecha) return "";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return d.toISOString().slice(0, 10);
}

/** Convierte "2018-03-14" en la medianoche UTC de ese día. */
export function fechaDesdeInput(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

export function formatQuetzales(monto: number | string): string {
  const numero = typeof monto === "string" ? Number(monto) : monto;
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(numero);
}
