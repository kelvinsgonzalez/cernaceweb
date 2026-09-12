import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock3, HandCoins, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, ChipDonacion, EnlaceBoton, Kpi, Tarjeta } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import {
  formatFechaHora,
  formatMontoOpcional,
  formatQuetzales,
} from "@/lib/fechas";
import { etiquetaMetodo, requiereBoleta } from "@/lib/pasarela";
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
  "Boleta",
  "Estado",
];

const ESTADOS = ["COMPLETADA", "PENDIENTE", "FALLIDA", "REEMBOLSADA"] as const;

/** Pendientes que ya traen boleta: la cola de trabajo del equipo. */
const POR_VERIFICAR = "POR_VERIFICAR";
const FILTRO_POR_VERIFICAR = {
  estado: "PENDIENTE" as const,
  boletaArchivo: { not: null },
};

export default async function DonacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requirePermiso(PERMISOS.DONACIONES_LEER);
  const { estado } = await searchParams;

  const filtro =
    estado === POR_VERIFICAR
      ? FILTRO_POR_VERIFICAR
      : ESTADOS.includes(estado as (typeof ESTADOS)[number])
        ? { estado: estado as (typeof ESTADOS)[number] }
        : {};

  const [donaciones, completadas, pendientes, porVerificar, recurrentes] =
    await Promise.all([
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
      prisma.donacion.count({ where: FILTRO_POR_VERIFICAR }),
      prisma.donacion.count({ where: { recurrente: true } }),
    ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Donaciones"
        descripcion="Los aportes con tarjeta los resuelve la pasarela. Los donativos depositados en el banco llegan sin identificar y con su boleta adjunta: hay que cotejarlos aquí y anotar de cuánto fueron."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total recaudado"
          valor={formatQuetzales(aNumero(completadas._sum.monto ?? 0))}
          detalle="Solo donaciones verificadas"
          icono={<HandCoins className="size-5" />}
        />
        <Kpi
          etiqueta="Donaciones completadas"
          valor={completadas._count}
          detalle={`${recurrentes} ${recurrentes === 1 ? "aporte recurrente" : "aportes recurrentes"}`}
          icono={<CircleCheck className="size-5" />}
        />
        <Kpi
          etiqueta="Boletas por verificar"
          valor={porVerificar}
          detalle="Esperando que alguien las coteje"
          icono={<Receipt className="size-5" />}
        />
        <Kpi
          etiqueta="Pendientes"
          valor={pendientes}
          detalle={`${pendientes - porVerificar} sin boleta`}
          icono={<Clock3 className="size-5" />}
        />
      </div>

      {porVerificar > 0 && estado !== POR_VERIFICAR ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
          <p className="font-medium">
            Hay {porVerificar}{" "}
            {porVerificar === 1 ? "boleta" : "boletas"} esperando revisión.
          </p>
          <EnlaceBoton
            href={`/admin/donaciones?estado=${POR_VERIFICAR}`}
            variante="contorno"
          >
            Revisarlas
          </EnlaceBoton>
        </div>
      ) : null}

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
              <option value={POR_VERIFICAR}>Con boleta por verificar</option>
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
          caption="Donaciones registradas con su referencia, monto, método, boleta y estado"
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
                  <Link
                    href={`/admin/donaciones/${donacion.id}`}
                    className="font-semibold text-brand-dark hover:underline"
                  >
                    {donacion.referenciaPasarela}
                  </Link>
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatFechaHora(donacion.createdAt)}
                </Celda>
                <Celda>
                  {/* Un donativo depositado en el banco llega sin identificar:
                      quien deposita solo sube la boleta. */}
                  {donacion.donanteNombre ? (
                    <>
                      <span className="font-medium">
                        {donacion.donanteNombre}
                      </span>
                      {donacion.donanteEmail ? (
                        <span className="block text-xs text-ink-soft">
                          {donacion.donanteEmail}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-soft">Sin identificar</span>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatMontoOpcional(donacion.monto)}
                  {donacion.recurrente ? (
                    <span className="block text-xs text-ink-soft">Mensual</span>
                  ) : null}
                </Celda>
                <Celda>{etiquetaMetodo(donacion.metodo)}</Celda>
                <Celda>
                  {donacion.destinoNino ? (
                    <>
                      <span className="font-medium">{donacion.destinoNino}</span>
                      <span className="block text-xs text-ink-soft">
                        Niño indicado por el donante
                      </span>
                    </>
                  ) : (
                    (donacion.campaign?.titulo ?? "Donde más se necesite")
                  )}
                </Celda>
                <Celda>
                  {donacion.boletaArchivo ? (
                    <Link
                      href={`/admin/donaciones/${donacion.id}`}
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      Ver boleta
                    </Link>
                  ) : requiereBoleta(donacion.metodo) &&
                    donacion.estado === "PENDIENTE" ? (
                    <Chip tono="warn">Sin boleta</Chip>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </Celda>
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
