import type { Metadata } from "next";
import Link from "next/link";
import {
  ChartLine,
  CircleCheck,
  Clock3,
  HandCoins,
  MessageCircleHeart,
  PenLine,
  Receipt,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  Chip,
  ChipDonacion,
  EnlaceBoton,
  Kpi,
  Tarjeta,
  TarjetaCabecera,
} from "@/components/ui";
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
import { METODOS_PAGO, etiquetaMetodo } from "@/lib/pasarela";
import { aNumero, primerNombre } from "@/lib/utils";
import { FormularioAporteManual } from "./formulario";
import { registrarAporteManual } from "./acciones";

export const metadata: Metadata = { title: "Donaciones" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Referencia",
  "Fecha",
  "De quién",
  "Monto",
  "Destino",
  "Comprobante",
  "Estado",
];

const ESTADOS = ["COMPLETADA", "PENDIENTE", "FALLIDA", "REEMBOLSADA"] as const;

/** Pendientes que ya traen foto: la cola de trabajo del equipo. */
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
  const usuario = await requirePermiso(PERMISOS.DONACIONES_LEER);
  const gestiona = tienePermiso(usuario, PERMISOS.DONACIONES_GESTIONAR);
  const { estado } = await searchParams;

  const filtro =
    estado === POR_VERIFICAR
      ? FILTRO_POR_VERIFICAR
      : ESTADOS.includes(estado as (typeof ESTADOS)[number])
        ? { estado: estado as (typeof ESTADOS)[number] }
        : {};

  const [donaciones, completadas, aprobadas, pendientes, porVerificar, compromisos, campanas] =
    await Promise.all([
      prisma.donacion.findMany({
        where: filtro,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: { select: { titulo: true, general: true } },
          beneficiario: { select: { id: true, codigoExpediente: true, nombres: true } },
          padrino: { select: { id: true, nombre: true } },
        },
      }),
      prisma.donacion.aggregate({
        where: { estado: "COMPLETADA" },
        _sum: { monto: true },
      }),
      prisma.donacion.count({ where: { estado: "COMPLETADA" } }),
      prisma.donacion.count({ where: { estado: "PENDIENTE" } }),
      prisma.donacion.count({ where: FILTRO_POR_VERIFICAR }),
      gestiona
        ? prisma.padrinazgo.findMany({
            where: { activo: true },
            select: {
              id: true,
              padrino: { select: { nombre: true } },
              beneficiario: { select: { codigoExpediente: true, nombres: true, apellidos: true } },
            },
            orderBy: { padrino: { nombre: "asc" } },
          })
        : [],
      gestiona
        ? prisma.campaign.findMany({
            where: { activa: true, eliminadaEn: null },
            select: { id: true, titulo: true, general: true },
            orderBy: [{ general: "desc" }, { titulo: "asc" }],
          })
        : [],
    ]);

  const destinos = [
    ...compromisos.map((c) => ({
      valor: `P:${c.id}`,
      etiqueta: `${c.padrino.nombre} → ${c.beneficiario.nombres} ${c.beneficiario.apellidos} (${c.beneficiario.codigoExpediente})`,
      grupo: "Apadrinamientos vigentes",
    })),
    ...campanas.map((c) => ({
      valor: `C:${c.id}`,
      etiqueta: c.titulo,
      grupo: "Campañas",
    })),
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Donaciones"
        descripcion="Todo aporte llega como una foto del comprobante: la de un padrino desde su portal, o la de cualquiera desde la portada. Aquí se coteja contra el estado de cuenta, se anota el monto y se aprueba o se rechaza con un mensaje."
        acciones={
          <EnlaceBoton href="/admin/donaciones/reportes" variante="contorno">
            <ChartLine aria-hidden="true" className="size-4" />
            Reportes
          </EnlaceBoton>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Total recaudado"
          valor={formatQuetzales(aNumero(completadas._sum?.monto ?? 0))}
          detalle="Solo aportes aprobados"
          icono={<HandCoins className="size-5" />}
        />
        <Kpi
          etiqueta="Aportes aprobados"
          valor={aprobadas}
          icono={<CircleCheck className="size-5" />}
        />
        <Kpi
          etiqueta="Por verificar"
          valor={porVerificar}
          detalle="Con foto, esperando que alguien la coteje"
          icono={<Receipt className="size-5" />}
        />
        <Kpi
          etiqueta="Pendientes"
          valor={pendientes}
          detalle={`${pendientes - porVerificar} sin comprobante`}
          icono={<Clock3 className="size-5" />}
        />
      </div>

      {porVerificar > 0 && estado !== POR_VERIFICAR ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
          <p className="font-medium">
            Hay {porVerificar}{" "}
            {porVerificar === 1 ? "aporte" : "aportes"} esperando revisión.
          </p>
          <EnlaceBoton
            href={`/admin/donaciones?estado=${POR_VERIFICAR}`}
            variante="contorno"
          >
            Revisarlos
          </EnlaceBoton>
        </div>
      ) : null}

      {gestiona ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Registrar un aporte a mano"
            descripcion="Para efectivo entregado en la oficina o un padrino que depositó y no subió la foto. Queda aprobado y fechado hoy."
            icono={<PenLine className="size-5" />}
          />
          <div className="p-5">
            <FormularioAporteManual
              accion={registrarAporteManual}
              destinos={destinos}
              metodos={METODOS_PAGO.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
            />
          </div>
        </Tarjeta>
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
              <option value={POR_VERIFICAR}>Con comprobante por verificar</option>
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
          caption="Aportes registrados con su referencia, origen, monto, destino, comprobante y estado"
          columnas={COLUMNAS}
        >
          {donaciones.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="No hay aportes con ese filtro."
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
                  {donacion.padrino ? (
                    <>
                      <span className="font-medium">{donacion.padrino.nombre}</span>
                      <span className="block text-xs text-ink-soft">Padrino</span>
                    </>
                  ) : donacion.donanteNombre ? (
                    <>
                      <span className="font-medium">{donacion.donanteNombre}</span>
                      {donacion.donanteEmail ? (
                        <span className="block text-xs text-ink-soft">
                          {donacion.donanteEmail}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-soft">Sin identificar</span>
                  )}
                  {donacion.mensaje ? (
                    <Chip
                      tono={donacion.mensajeVisibleFamilia ? "ok" : "neutro"}
                      className="mt-1"
                      icono={<MessageCircleHeart aria-hidden="true" className="size-3.5" />}
                    >
                      {donacion.mensajeVisibleFamilia ? "Mensaje publicado" : "Con mensaje"}
                    </Chip>
                  ) : null}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatMontoOpcional(donacion.monto)}
                  <span className="block text-xs text-ink-soft">
                    {etiquetaMetodo(donacion.metodo)}
                  </span>
                </Celda>
                <Celda>
                  {donacion.beneficiario ? (
                    <>
                      <Link
                        href={`/admin/beneficiarios/${donacion.beneficiario.id}`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {primerNombre(donacion.beneficiario.nombres)}
                      </Link>
                      <span className="block font-mono text-xs text-ink-soft">
                        {donacion.beneficiario.codigoExpediente}
                      </span>
                    </>
                  ) : donacion.campaign ? (
                    <span className="font-medium">{donacion.campaign.titulo}</span>
                  ) : (
                    <span className="text-ink-soft">Sin destino</span>
                  )}
                </Celda>
                <Celda>
                  {donacion.boletaArchivo ? (
                    <Link
                      href={`/admin/donaciones/${donacion.id}`}
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      Ver foto
                    </Link>
                  ) : donacion.estado === "PENDIENTE" ? (
                    <Chip tono="warn">Sin foto</Chip>
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
