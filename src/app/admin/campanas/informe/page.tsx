import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Kpi, Tarjeta } from "@/components/ui";
import { Celda, EncabezadoPagina, Fila, FilaVacia, Tabla } from "@/components/admin/estructura";
import { BotonImprimir } from "@/components/admin/boton-imprimir";
import { formatFecha, formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { porcentaje, recaudadoPorCampana } from "@/lib/aportes";

export const metadata: Metadata = { title: "Informe financiero de campañas" };

export const dynamic = "force-dynamic";

/**
 * Informe para imprimir: todas las campañas, abiertas y cerradas, con su meta,
 * lo recaudado (aportes aprobados), lo que aún está pendiente de aprobar y el
 * total general. Al imprimir se ocultan la navegación y los botones.
 */
export default async function InformeCampanasPage() {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_LEER);
  const hoy = new Date();

  const campanas = await prisma.campaign.findMany({
    orderBy: [{ activa: "desc" }, { general: "asc" }, { fechaFin: "asc" }],
    include: {
      _count: { select: { donaciones: { where: { estado: "COMPLETADA" } } } },
    },
  });
  const ids = campanas.map((c) => c.id);
  const recaudado = await recaudadoPorCampana(ids);
  const pendientes = new Map(
    (
      await prisma.donacion.groupBy({
        by: ["campaignId"],
        where: { campaignId: { in: ids }, estado: "PENDIENTE" },
        _sum: { monto: true },
        _count: { _all: true },
      })
    ).map((f) => [
      f.campaignId as string,
      { monto: aNumero(f._sum?.monto ?? 0), cantidad: f._count._all },
    ]),
  );

  const filas = campanas.map((c) => {
    const meta = c.general ? 0 : aNumero(c.meta);
    const suma = recaudado.get(c.id) ?? 0;
    const pend = pendientes.get(c.id) ?? { monto: 0, cantidad: 0 };
    return { campana: c, meta, suma, pend, avance: porcentaje(suma, meta) };
  });

  const totales = filas.reduce(
    (t, f) => ({
      meta: t.meta + f.meta,
      recaudado: t.recaudado + f.suma,
      aportes: t.aportes + f.campana._count.donaciones,
      pendiente: t.pendiente + f.pend.monto,
      pendientes: t.pendientes + f.pend.cantidad,
    }),
    { meta: 0, recaudado: 0, aportes: 0, pendiente: 0, pendientes: 0 },
  );
  const activas = campanas.filter((c) => c.activa).length;

  return (
    <>
      <Link
        href="/admin/campanas"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a campañas
      </Link>

      <EncabezadoPagina
        titulo="Informe financiero de campañas"
        descripcion={`Emitido el ${formatFechaHora(hoy)} por ${usuario.nombre}. Lo recaudado son los aportes aprobados; lo pendiente, los que aún esperan revisión.`}
        acciones={<BotonImprimir etiqueta="Imprimir informe" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
        <Kpi
          etiqueta="Campañas"
          valor={campanas.length}
          detalle={`${activas} activas, ${campanas.length - activas} cerradas`}
        />
        <Kpi
          etiqueta="Meta total"
          valor={formatQuetzales(totales.meta)}
          detalle="Sin contar la campaña general"
        />
        <Kpi
          etiqueta="Recaudado"
          valor={formatQuetzales(totales.recaudado)}
          detalle={`${totales.aportes} aportes aprobados`}
        />
        <Kpi
          etiqueta="Pendiente de aprobar"
          valor={formatQuetzales(totales.pendiente)}
          detalle={`${totales.pendientes} aportes en revisión`}
        />
      </div>

      <Tabla
        caption="Meta, recaudado y avance de cada campaña"
        columnas={[
          "Campaña",
          "Estado",
          "Periodo",
          "Meta",
          "Recaudado",
          "Avance",
          "Aportes",
          "Pendiente",
        ]}
      >
        {filas.length === 0 ? (
          <FilaVacia columnas={8} mensaje="No hay campañas registradas." />
        ) : (
          filas.map(({ campana, meta, suma, pend, avance }) => {
            const vencida = Boolean(campana.fechaFin && campana.fechaFin < hoy);
            return (
              <Fila key={campana.id}>
                <Celda className="font-semibold">{campana.titulo}</Celda>
                <Celda>
                  {campana.general ? (
                    <Chip tono="info">General</Chip>
                  ) : campana.eliminadaEn ? (
                    <Chip tono="warn">Eliminada</Chip>
                  ) : !campana.activa ? (
                    <Chip tono="neutro">Cerrada</Chip>
                  ) : vencida ? (
                    <Chip tono="warn">Vencida</Chip>
                  ) : (
                    <Chip tono="ok">Activa</Chip>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap text-ink-soft">
                  {formatFecha(campana.fechaInicio)}
                  {campana.general
                    ? " en adelante"
                    : ` — ${campana.fechaFin ? formatFecha(campana.fechaFin) : "sin cierre"}`}
                </Celda>
                <Celda className="whitespace-nowrap tabular-nums">
                  {campana.general ? "—" : formatQuetzales(meta)}
                </Celda>
                <Celda className="whitespace-nowrap tabular-nums">{formatQuetzales(suma)}</Celda>
                <Celda className="tabular-nums">{campana.general ? "—" : `${avance}%`}</Celda>
                <Celda className="tabular-nums">{campana._count.donaciones}</Celda>
                <Celda className="whitespace-nowrap tabular-nums text-ink-soft">
                  {pend.cantidad > 0 ? `${formatQuetzales(pend.monto)} (${pend.cantidad})` : "—"}
                </Celda>
              </Fila>
            );
          })
        )}
        {filas.length > 0 ? (
          <tr className="border-t-2 border-line bg-canvas font-semibold">
            <Celda>Total</Celda>
            <Celda>{""}</Celda>
            <Celda>{""}</Celda>
            <Celda className="whitespace-nowrap tabular-nums">{formatQuetzales(totales.meta)}</Celda>
            <Celda className="whitespace-nowrap tabular-nums">
              {formatQuetzales(totales.recaudado)}
            </Celda>
            <Celda className="tabular-nums">
              {totales.meta > 0 ? `${porcentaje(totales.recaudado, totales.meta)}%` : "—"}
            </Celda>
            <Celda className="tabular-nums">{totales.aportes}</Celda>
            <Celda className="whitespace-nowrap tabular-nums">
              {formatQuetzales(totales.pendiente)} ({totales.pendientes})
            </Celda>
          </tr>
        ) : null}
      </Tabla>

      <Tarjeta className="mt-6 hidden p-4 text-xs text-ink-soft print:block">
        CERNACE · Informe financiero de campañas · {formatFechaHora(hoy)}
      </Tarjeta>
    </>
  );
}
