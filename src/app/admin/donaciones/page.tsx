import type { Metadata } from "next";
import { CircleCheck, Clock3, HandCoins, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, ChipDonacion, EnlaceBoton, Kpi, Tarjeta } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { etiquetaMetodo } from "@/lib/pasarela";
import { aNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Donaciones" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Referencia",
  "Fecha",
  "Donante",
  "Monto",
  "Método",
  "Destino",
  "Estado",
];

const ESTADOS = ["COMPLETADA", "PENDIENTE", "FALLIDA", "REEMBOLSADA"] as const;

export default async function DonacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requirePermiso(PERMISOS.DONACIONES_LEER);
  const { estado } = await searchParams;

  const filtro = ESTADOS.includes(estado as (typeof ESTADOS)[number])
    ? { estado: estado as (typeof ESTADOS)[number] }
    : {};

  const [donaciones, completadas, pendientes, recurrentes] = await Promise.all([
    prisma.donacion.findMany({
      where: filtro,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { titulo: true } } },
    }),
    prisma.donacion.aggregate({
      where: { estado: "COMPLETADA" },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.donacion.count({ where: { estado: "PENDIENTE" } }),
    prisma.donacion.count({ where: { recurrente: true } }),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Donaciones"
        descripcion="Todas las transacciones registradas por la pasarela, en modo prueba."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total recaudado"
          valor={formatQuetzales(aNumero(completadas._sum.monto ?? 0))}
          icono={<HandCoins className="size-5" />}
        />
        <Kpi
          etiqueta="Donaciones completadas"
          valor={completadas._count}
          icono={<CircleCheck className="size-5" />}
        />
        <Kpi
          etiqueta="Pendientes"
          valor={pendientes}
          icono={<Clock3 className="size-5" />}
        />
        <Kpi
          etiqueta="Aportes recurrentes"
          valor={recurrentes}
          icono={<TrendingUp className="size-5" />}
        />
      </div>

      <Tarjeta className="mt-8 p-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estado" className="text-sm font-semibold text-ink">
              Filtrar por estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todos</option>
              {ESTADOS.map((valor) => (
                <option key={valor} value={valor}>
                  {valor.charAt(0) + valor.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <Boton type="submit" variante="contorno">
            Filtrar
          </Boton>
          {estado ? (
            <EnlaceBoton href="/admin/donaciones" variante="suave">
              Limpiar
            </EnlaceBoton>
          ) : null}
        </form>
      </Tarjeta>

      <div className="mt-6">
        <Tabla
          caption="Donaciones registradas con su referencia, monto, método y estado"
          columnas={COLUMNAS}
        >
          {donaciones.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="No hay donaciones con ese filtro."
            />
          ) : (
            donaciones.map((donacion) => (
              <Fila key={donacion.id}>
                <Celda className="font-mono text-xs">
                  {donacion.referenciaPasarela}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatFechaHora(donacion.createdAt)}
                </Celda>
                <Celda>
                  <span className="font-medium">{donacion.donanteNombre}</span>
                  <span className="block text-xs text-ink-soft">
                    {donacion.donanteEmail}
                  </span>
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatQuetzales(aNumero(donacion.monto))}
                  {donacion.recurrente ? (
                    <span className="block text-xs text-ink-soft">Mensual</span>
                  ) : null}
                </Celda>
                <Celda>{etiquetaMetodo(donacion.metodo)}</Celda>
                <Celda>{donacion.campaign?.titulo ?? "Donde más se necesite"}</Celda>
                <Celda>
                  <ChipDonacion estado={donacion.estado} />
                </Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>
    </>
  );
}
