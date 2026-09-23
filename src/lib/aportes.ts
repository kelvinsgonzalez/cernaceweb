import { prisma } from "@/lib/prisma";
import { aNumero } from "@/lib/utils";

/**
 * Aportes de padrinos y campañas: lo que se calcula al momento y no se guarda.
 *
 * El aporte es voluntario. El aporte mensual de referencia del compromiso solo
 * alimenta la barra de ánimo de la ficha del niño; no hay cuotas atrasadas ni
 * meses cubiertos. Los recordatorios al padrino y el aviso al administrador se
 * cuentan desde el último aporte enviado (aprobado o pendiente: un aporte que
 * el admin todavía no revisó no debe generar reproches).
 */

/** Más de un mes sin aportar: el recordatorio suave, en nombre del niño. */
export const MENSAJE_UN_MES =
  "Gracias a ti he avanzado mucho. Gracias por tus aportes.";
/** Más de tres meses: la petición de ayuda. */
export const MENSAJE_TRES_MESES = "Ayúdame a seguir con mis terapias.";

export const DIAS_RECORDATORIO_SUAVE = 30;
export const DIAS_RECORDATORIO_FUERTE = 90;
/** Seis meses sin aportar: aviso al administrador, que decide. */
export const DIAS_AVISO_ADMIN = 180;
/** Con cuánta antelación se avisa de una caducidad. */
export const DIAS_CADUCA_PRONTO = 30;

const MS_DIA = 24 * 60 * 60 * 1000;

export function diasEntre(desde: Date, hasta: Date = new Date()): number {
  return Math.floor((hasta.getTime() - desde.getTime()) / MS_DIA);
}

export function inicioDeMes(fecha: Date = new Date()): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export function finDeMes(fecha: Date = new Date()): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
}

export type Recordatorio = {
  nivel: "SUAVE" | "FUERTE";
  texto: string;
  dias: number;
};

/**
 * Qué recordatorio ve el padrino, si alguno. Sin ningún aporte, se cuenta
 * desde el inicio del compromiso: recién asignado no hay nada que recordar.
 */
export function recordatorioPara(
  ultimoAporte: Date | null,
  fechaInicio: Date,
  hoy: Date = new Date(),
): Recordatorio | null {
  const dias = diasEntre(ultimoAporte ?? fechaInicio, hoy);
  if (dias > DIAS_RECORDATORIO_FUERTE) {
    return { nivel: "FUERTE", texto: MENSAJE_TRES_MESES, dias };
  }
  if (dias > DIAS_RECORDATORIO_SUAVE) {
    return { nivel: "SUAVE", texto: MENSAJE_UN_MES, dias };
  }
  return null;
}

/**
 * El aviso de seis meses para el administrador. «Mantener» lo apaga otros seis
 * meses; un aporte nuevo lo apaga solo.
 */
export function necesitaAvisoAdmin(
  ultimoAporte: Date | null,
  fechaInicio: Date,
  avisoAtendidoEl: Date | null,
  hoy: Date = new Date(),
): boolean {
  const referencia = [ultimoAporte, fechaInicio, avisoAtendidoEl]
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  return diasEntre(referencia, hoy) > DIAS_AVISO_ADMIN;
}

export type ResumenCompromiso = {
  aportadoMes: number;
  totalAportado: number;
  cuentaAportes: number;
  ultimoAporte: Date | null;
  pendientes: number;
};

/**
 * Lo que la ficha del niño y el panel muestran de un compromiso: cuánto va
 * este mes, cuánto en total y cuándo fue el último aporte.
 */
export async function resumenCompromiso(
  padrinazgoId: string,
  hoy: Date = new Date(),
): Promise<ResumenCompromiso> {
  const [mes, total, cuentaAportes, ultimo, pendientes] = await Promise.all([
    prisma.donacion.aggregate({
      where: {
        padrinazgoId,
        estado: "COMPLETADA",
        createdAt: { gte: inicioDeMes(hoy), lt: finDeMes(hoy) },
      },
      _sum: { monto: true },
    }),
    prisma.donacion.aggregate({
      where: { padrinazgoId, estado: "COMPLETADA" },
      _sum: { monto: true },
    }),
    prisma.donacion.count({ where: { padrinazgoId, estado: "COMPLETADA" } }),
    prisma.donacion.findFirst({
      where: { padrinazgoId, estado: { not: "FALLIDA" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.donacion.count({ where: { padrinazgoId, estado: "PENDIENTE" } }),
  ]);

  return {
    aportadoMes: aNumero(mes._sum?.monto ?? 0),
    totalAportado: aNumero(total._sum?.monto ?? 0),
    cuentaAportes,
    ultimoAporte: ultimo?.createdAt ?? null,
    pendientes,
  };
}

export type ResumenBreve = {
  aportadoMes: number;
  totalAportado: number;
  ultimoAporte: Date | null;
};

/**
 * Lo mismo que `resumenCompromiso`, para muchos compromisos a la vez y en
 * tres consultas: es lo que necesita el listado de Asignaciones.
 */
export async function resumenesCompromisos(
  ids: string[],
  hoy: Date = new Date(),
): Promise<Map<string, ResumenBreve>> {
  const mapa = new Map<string, ResumenBreve>();
  if (ids.length === 0) return mapa;
  for (const id of ids) {
    mapa.set(id, { aportadoMes: 0, totalAportado: 0, ultimoAporte: null });
  }
  const [mes, total, ultimos] = await Promise.all([
    prisma.donacion.groupBy({
      by: ["padrinazgoId"],
      where: {
        padrinazgoId: { in: ids },
        estado: "COMPLETADA",
        createdAt: { gte: inicioDeMes(hoy), lt: finDeMes(hoy) },
      },
      _sum: { monto: true },
    }),
    prisma.donacion.groupBy({
      by: ["padrinazgoId"],
      where: { padrinazgoId: { in: ids }, estado: "COMPLETADA" },
      _sum: { monto: true },
    }),
    prisma.donacion.groupBy({
      by: ["padrinazgoId"],
      where: { padrinazgoId: { in: ids }, estado: { not: "FALLIDA" } },
      _max: { createdAt: true },
    }),
  ]);
  for (const f of mes) {
    const r = mapa.get(f.padrinazgoId as string);
    if (r) r.aportadoMes = aNumero(f._sum?.monto ?? 0);
  }
  for (const f of total) {
    const r = mapa.get(f.padrinazgoId as string);
    if (r) r.totalAportado = aNumero(f._sum?.monto ?? 0);
  }
  for (const f of ultimos) {
    const r = mapa.get(f.padrinazgoId as string);
    if (r) r.ultimoAporte = f._max?.createdAt ?? null;
  }
  return mapa;
}

/** Porcentaje acotado para una barra. Sin meta, no hay porcentaje. */
export function porcentaje(valor: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((valor / meta) * 100)));
}

/**
 * Las campañas que se enseñan: activas y sin fecha límite pasada, la general
 * siempre al final. Una campaña cerrada desaparece de todos lados menos del
 * informe del administrador.
 */
export async function campanasActivas() {
  const hoy = new Date();
  const campanas = await prisma.campaign.findMany({
    where: {
      activa: true,
      eliminadaEn: null,
      OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
    },
    orderBy: [{ general: "asc" }, { fechaFin: "asc" }, { createdAt: "asc" }],
    include: {
      fotos: { orderBy: { orden: "asc" }, select: { id: true, alt: true } },
    },
  });
  const recaudado = await recaudadoPorCampana(campanas.map((c) => c.id));
  return campanas.map((c) => ({
    ...c,
    recaudado: recaudado.get(c.id) ?? 0,
  }));
}

/** Lo recaudado por campaña: la suma de sus aportes aprobados, nada a mano. */
export async function recaudadoPorCampana(
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const filas = await prisma.donacion.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: ids }, estado: "COMPLETADA" },
    _sum: { monto: true },
  });
  return new Map(
    filas.map((f) => [f.campaignId as string, aNumero(f._sum?.monto ?? 0)]),
  );
}

/** Cuántas campañas con recaudación hay activas ahora, para el aviso. */
export async function contarCampanasActivas(): Promise<number> {
  const hoy = new Date();
  return prisma.campaign.count({
    where: {
      activa: true,
      eliminadaEn: null,
      general: false,
      OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
    },
  });
}

/** Mes en formato legible para los reportes: «septiembre 2026». */
export function etiquetaMes(fecha: Date): string {
  return new Intl.DateTimeFormat("es-GT", { month: "long", year: "numeric" }).format(
    fecha,
  );
}
