import { prisma } from "@/lib/prisma";

/**
 * Alerta de «sin terapia reciente»: un beneficiario activo del que no hay
 * ningún avance registrado en los últimos N meses.
 *
 * Hoy la única evidencia de que un niño recibió terapia es la reseña de avance
 * que escribe el terapeuta, así que se mide sobre `Seguimiento.fecha`. Cuando
 * exista un registro de sesiones bastará con cambiar aquí la fuente.
 *
 * Los meses salen de la configuración (`seguimiento.mesesSinTerapia`); si la
 * fila no existe se usan seis.
 */
export const MESES_SIN_TERAPIA_PREDETERMINADO = 6;
export const CLAVE_MESES_SIN_TERAPIA = "seguimiento.mesesSinTerapia";

export async function mesesSinTerapia(): Promise<number> {
  const ajuste = await prisma.setting.findUnique({
    where: { clave: CLAVE_MESES_SIN_TERAPIA },
    select: { valor: true },
  });
  const meses = Number(ajuste?.valor);
  return Number.isInteger(meses) && meses > 0
    ? meses
    : MESES_SIN_TERAPIA_PREDETERMINADO;
}

const ZONA_GUATEMALA = "America/Guatemala";

/**
 * La fecha de hoy en Guatemala, como fecha de calendario a medianoche UTC,
 * que es como la base guarda las fechas sin hora. Se calcula con la zona
 * explícita y no con `new Date()` a secas: después de las 18:00 en Guatemala
 * el reloj UTC ya va en el día siguiente.
 */
export function hoyEnGuatemala(ahora = new Date()): Date {
  const [anio, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_GUATEMALA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(ahora)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Primer día que todavía cuenta como «reciente»: hoy menos N meses. */
export function fechaLimiteSinTerapia(
  meses: number,
  hoy = hoyEnGuatemala(),
): Date {
  return new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - meses, hoy.getUTCDate()),
  );
}

/**
 * Filtro Prisma de la alerta: activos, inscritos desde antes del límite y sin
 * ningún avance desde entonces. Quien ingresó hace menos de N meses no entra:
 * todavía no ha tenido tiempo de acumular esa ausencia.
 */
export function filtroSinTerapiaReciente(limite: Date) {
  return {
    estado: "ACTIVO" as const,
    fechaIngreso: { lt: limite },
    seguimientos: { none: { fecha: { gte: limite } } },
  };
}

/** La misma regla, para una fila ya cargada. */
export function sinTerapiaReciente(
  b: { estado: string; fechaIngreso: Date },
  ultimoAvance: Date | null,
  limite: Date,
): boolean {
  return (
    b.estado === "ACTIVO" &&
    b.fechaIngreso < limite &&
    (!ultimoAvance || ultimoAvance < limite)
  );
}
