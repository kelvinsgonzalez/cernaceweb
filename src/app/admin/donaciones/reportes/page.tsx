import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, EnlaceBoton, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { Celda, EncabezadoPagina, Fila, FilaVacia, Tabla } from "@/components/admin/estructura";
import { fechaParaInput, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import {
  filasReporte,
  porCampana,
  porMes,
  porNino,
  porPadrino,
  rangoDesdeParametros,
} from "@/lib/reportes";

export const metadata: Metadata = { title: "Reportes de aportes" };

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requirePermiso(PERMISOS.DONACIONES_LEER);
  const { desde, hasta } = await searchParams;
  const rango = rangoDesdeParametros(desde, hasta);
  const filas = await filasReporte(rango);

  const total = filas.reduce((suma, f) => suma + aNumero(f.monto ?? 0), 0);
  const ninos = porNino(filas);
  const padrinos = porPadrino(filas);
  const campanas = porCampana(filas);
  const meses = porMes(filas);
  const consulta = `desde=${fechaParaInput(rango.desde)}&hasta=${fechaParaInput(rango.hasta)}`;

  return (
    <>
      <Link
        href="/admin/donaciones"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a donaciones
      </Link>

      <EncabezadoPagina
        titulo="Reportes de aportes"
        descripcion="Solo aportes aprobados. Lo recibido por cada niño (por su código de expediente), por cada padrino, por campaña y por mes."
        acciones={
          <EnlaceBoton href={`/api/reportes/aportes?${consulta}`} variante="contorno">
            <Download aria-hidden="true" className="size-4" />
            Exportar CSV
          </EnlaceBoton>
        }
      />

      <Tarjeta className="p-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desde" className="text-sm font-semibold text-ink">Desde</label>
            <input
              id="desde"
              name="desde"
              type="date"
              defaultValue={fechaParaInput(rango.desde)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hasta" className="text-sm font-semibold text-ink">Hasta</label>
            <input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={fechaParaInput(rango.hasta)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </div>
          <Boton type="submit" variante="contorno">Aplicar</Boton>
        </form>
      </Tarjeta>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Recibido en el periodo" valor={formatQuetzales(total)} detalle={`${formatFecha(rango.desde)} a ${formatFecha(rango.hasta)}`} />
        <Kpi etiqueta="Aportes aprobados" valor={filas.length} />
        <Kpi etiqueta="Niños con aportes" valor={ninos.length} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Por niño" descripcion="Lo recibido por cada expediente y de qué padrinos vino." />
          <Tabla caption="Aportes por niño" columnas={["Código", "Niño", "Padrinos", "Aportes", "Total"]}>
            {ninos.length === 0 ? (
              <FilaVacia columnas={5} mensaje="Ningún aporte dirigido a un niño en este periodo." />
            ) : (
              ninos.map((g) => (
                <Fila key={g.clave}>
                  <Celda className="font-mono text-xs">{g.etiqueta.codigo}</Celda>
                  <Celda>
                    <Link href={`/admin/beneficiarios/${g.etiqueta.id}`} className="font-medium text-brand-dark hover:underline">
                      {g.etiqueta.nombre}
                    </Link>
                  </Celda>
                  <Celda>{g.etiqueta.padrinos.join(", ") || "—"}</Celda>
                  <Celda>{g.cuenta}</Celda>
                  <Celda className="whitespace-nowrap font-semibold">{formatQuetzales(g.total)}</Celda>
                </Fila>
              ))
            )}
          </Tabla>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Por padrino" descripcion="Lo aportado por cada padrino, a niños o a campañas." />
          <Tabla caption="Aportes por padrino" columnas={["Padrino", "Aportes", "Total"]}>
            {padrinos.length === 0 ? (
              <FilaVacia columnas={3} mensaje="Ningún aporte de padrinos en este periodo." />
            ) : (
              padrinos.map((g) => (
                <Fila key={g.clave}>
                  <Celda>
                    <Link href={`/admin/donantes/${g.etiqueta.id}`} className="font-medium text-brand-dark hover:underline">
                      {g.etiqueta.nombre}
                    </Link>
                  </Celda>
                  <Celda>{g.cuenta}</Celda>
                  <Celda className="whitespace-nowrap font-semibold">{formatQuetzales(g.total)}</Celda>
                </Fila>
              ))
            )}
          </Tabla>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Por campaña" />
          <Tabla caption="Aportes por campaña" columnas={["Campaña", "Aportes", "Total"]}>
            {campanas.length === 0 ? (
              <FilaVacia columnas={3} mensaje="Ningún aporte a campañas en este periodo." />
            ) : (
              campanas.map((g) => (
                <Fila key={g.clave}>
                  <Celda>
                    <Link href={`/admin/campanas/${g.etiqueta.id}`} className="font-medium text-brand-dark hover:underline">
                      {g.etiqueta.titulo}
                    </Link>
                  </Celda>
                  <Celda>{g.cuenta}</Celda>
                  <Celda className="whitespace-nowrap font-semibold">{formatQuetzales(g.total)}</Celda>
                </Fila>
              ))
            )}
          </Tabla>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Por mes" />
          <Tabla caption="Aportes por mes" columnas={["Mes", "Aportes", "Total"]}>
            {meses.length === 0 ? (
              <FilaVacia columnas={3} mensaje="Sin aportes en este periodo." />
            ) : (
              meses.map((g) => (
                <Fila key={g.clave}>
                  <Celda className="capitalize">{g.etiqueta}</Celda>
                  <Celda>{g.cuenta}</Celda>
                  <Celda className="whitespace-nowrap font-semibold">{formatQuetzales(g.total)}</Celda>
                </Fila>
              ))
            )}
          </Tabla>
        </Tarjeta>
      </div>
    </>
  );
}
