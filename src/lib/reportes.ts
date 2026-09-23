import { prisma } from "@/lib/prisma";
import { aNumero } from "@/lib/utils";
import { etiquetaMes, inicioDeMes } from "@/lib/aportes";

/**
 * Reportes de aportes aprobados en un rango de fechas: por niño (código de
 * expediente), por padrino, por campaña y por mes. Todo sale de la misma
 * consulta y se agrupa aquí; la exportación a CSV usa las mismas filas.
 */

export type RangoReporte = { desde: Date; hasta: Date };

/** El rango por defecto: desde el primer día del año hasta hoy. */
export function rangoPorDefecto(hoy: Date = new Date()): RangoReporte {
  return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: hoy };
}

/** Interpreta las fechas de la URL; lo que no sea una fecha cae al defecto. */
export function rangoDesdeParametros(
  desde?: string,
  hasta?: string,
): RangoReporte {
  const base = rangoPorDefecto();
  const d = desde && /^\d{4}-\d{2}-\d{2}$/.test(desde) ? new Date(`${desde}T00:00:00`) : base.desde;
  const h = hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta) ? new Date(`${hasta}T23:59:59.999`) : base.hasta;
  return { desde: d, hasta: h };
}

export async function filasReporte(rango: RangoReporte) {
  return prisma.donacion.findMany({
    where: {
      estado: "COMPLETADA",
      createdAt: { gte: rango.desde, lte: rango.hasta },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      referenciaPasarela: true,
      tipo: true,
      monto: true,
      moneda: true,
      metodo: true,
      donanteNombre: true,
      padrino: { select: { id: true, nombre: true } },
      beneficiario: {
        select: { id: true, codigoExpediente: true, nombres: true, apellidos: true },
      },
      campaign: { select: { id: true, titulo: true, general: true } },
    },
  });
}

export type FilaReporte = Awaited<ReturnType<typeof filasReporte>>[number];

type Grupo<T> = { clave: string; etiqueta: T; total: number; cuenta: number };

function agrupar<T>(
  filas: FilaReporte[],
  clave: (f: FilaReporte) => { clave: string; etiqueta: T } | null,
): Grupo<T>[] {
  const mapa = new Map<string, Grupo<T>>();
  for (const fila of filas) {
    const k = clave(fila);
    if (!k) continue;
    const actual = mapa.get(k.clave) ?? {
      clave: k.clave,
      etiqueta: k.etiqueta,
      total: 0,
      cuenta: 0,
    };
    actual.total += aNumero(fila.monto ?? 0);
    actual.cuenta += 1;
    mapa.set(k.clave, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

export function porNino(filas: FilaReporte[]) {
  return agrupar(filas, (f) =>
    f.beneficiario
      ? {
          clave: f.beneficiario.id,
          etiqueta: {
            id: f.beneficiario.id,
            codigo: f.beneficiario.codigoExpediente,
            nombre: `${f.beneficiario.nombres} ${f.beneficiario.apellidos}`,
            padrinos: [...new Set(filas
              .filter((x) => x.beneficiario?.id === f.beneficiario?.id && x.padrino)
              .map((x) => x.padrino?.nombre as string))],
          },
        }
      : null,
  );
}

export function porPadrino(filas: FilaReporte[]) {
  return agrupar(filas, (f) =>
    f.padrino
      ? { clave: f.padrino.id, etiqueta: { id: f.padrino.id, nombre: f.padrino.nombre } }
      : null,
  );
}

export function porCampana(filas: FilaReporte[]) {
  return agrupar(filas, (f) =>
    f.campaign
      ? {
          clave: f.campaign.id,
          etiqueta: { id: f.campaign.id, titulo: f.campaign.titulo, general: f.campaign.general },
        }
      : null,
  );
}

export function porMes(filas: FilaReporte[]) {
  return agrupar(filas, (f) => {
    const mes = inicioDeMes(f.createdAt);
    return { clave: mes.toISOString(), etiqueta: etiquetaMes(mes) };
  }).sort((a, b) => (a.clave < b.clave ? 1 : -1));
}

/** Una fila por aporte, lista para abrir en Excel. */
export function aCsv(filas: FilaReporte[]): string {
  const escapar = (v: string | number | null | undefined) => {
    const texto = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const cabecera = [
    "Fecha",
    "Referencia",
    "Tipo",
    "Padrino",
    "De parte de",
    "Código del niño",
    "Niño",
    "Campaña",
    "Monto",
    "Moneda",
    "Método",
  ];
  const lineas = filas.map((f) =>
    [
      f.createdAt.toISOString().slice(0, 10),
      f.referenciaPasarela,
      f.tipo,
      f.padrino?.nombre ?? "",
      f.donanteNombre ?? "",
      f.beneficiario?.codigoExpediente ?? "",
      f.beneficiario ? `${f.beneficiario.nombres} ${f.beneficiario.apellidos}` : "",
      f.campaign?.titulo ?? "",
      aNumero(f.monto ?? 0).toFixed(2),
      f.moneda,
      f.metodo,
    ]
      .map(escapar)
      .join(","),
  );
  // El BOM hace que Excel abra el archivo con acentos bien.
  return `﻿${[cabecera.join(","), ...lineas].join("\r\n")}`;
}
