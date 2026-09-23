import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, ChartLine, ExternalLink, ImageOff, Megaphone, Plus, Printer, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, EnlaceBoton, Tarjeta, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import {
  EnlaceMenu,
  MenuAcciones,
  OpcionConfirmada,
  OpcionMenu,
} from "@/components/admin/menu-acciones";
import { fechaParaInput, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { porcentaje, recaudadoPorCampana } from "@/lib/aportes";
import { rutaCampana } from "@/lib/sitio";
import { FormularioCampana } from "./formulario";
import { alternarCampana, crearCampana, eliminarCampana } from "./acciones";

export const metadata: Metadata = { title: "Campañas" };

export const dynamic = "force-dynamic";

const PANEL_NUEVA = "nueva-campana";

export default async function CampanasPage() {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_LEER);
  const gestiona = tienePermiso(usuario, PERMISOS.DONACIONES_GESTIONAR);
  const hoy = new Date();

  const campanas = await prisma.campaign.findMany({
    // Las eliminadas ya no son de este listado: viven solo en los informes.
    where: { eliminadaEn: null },
    orderBy: [{ activa: "desc" }, { general: "asc" }, { fechaFin: "asc" }],
    include: {
      _count: { select: { donaciones: { where: { estado: "COMPLETADA" } } } },
      fotos: { orderBy: { orden: "asc" }, take: 1, select: { id: true, alt: true } },
    },
  });
  const recaudado = await recaudadoPorCampana(campanas.map((c) => c.id));

  return (
    <>
      <EncabezadoPagina
        titulo="Campañas"
        acciones={
          <>
            <EnlaceBoton href="/admin/campanas/informe" variante="gris">
              <Printer aria-hidden="true" className="size-4" />
              Imprimir informe financiero
            </EnlaceBoton>
            {gestiona ? (
              <Boton type="button" popoverTarget={PANEL_NUEVA} className="menu-disparador">
                <Plus aria-hidden="true" className="size-4" />
                Nueva campaña
              </Boton>
            ) : null}
          </>
        }
      />

      {gestiona ? (
        // Misma capa superior que las fichas públicas: la Popover API pone el
        // fondo atenuado y el cierre con Esc o tocando fuera. Sin la API, el
        // formulario queda a la vista como una tarjeta normal.
        <div
          id={PANEL_NUEVA}
          popover="auto"
          role="dialog"
          aria-labelledby={`${PANEL_NUEVA}-titulo`}
          className="hoja-info mb-8"
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
                <Megaphone aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2
                  id={`${PANEL_NUEVA}-titulo`}
                  className="font-heading text-xl font-semibold text-ink"
                >
                  Nueva campaña
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Título, descripción corta, monto esperado, fecha límite y fotos.
                </p>
              </div>
            </div>
            <button
              type="button"
              popoverTarget={PANEL_NUEVA}
              popoverTargetAction="hide"
              aria-label="Cerrar"
              className="menu-disparador inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand-primary hover:text-brand-primary"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="hoja-info-cuerpo px-5 py-5 sm:px-7">
            <FormularioCampana accion={crearCampana} hoy={fechaParaInput(hoy)} />
          </div>
        </div>
      ) : null}

      {campanas.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="No hay campañas registradas." />
        </Tarjeta>
      ) : (
        <ul className="flex flex-col gap-2">
          {campanas.map((campana) => {
            const meta = aNumero(campana.meta);
            const suma = recaudado.get(campana.id) ?? 0;
            const avance = Math.max(0, Math.min(100, Math.round(porcentaje(suma, meta))));
            const vencida = Boolean(campana.fechaFin && campana.fechaFin < hoy);
            const foto = campana.fotos[0];
            const menu = `campana-${campana.id}`;
            return (
              <li key={campana.id}>
                <Tarjeta className="flex items-center gap-3 overflow-hidden py-2 pr-2 pl-2 sm:gap-4">
                  {foto ? (
                    <Image
                      src={`/api/campanas/fotos/${foto.id}`}
                      alt={foto.alt ?? ""}
                      width={112}
                      height={64}
                      unoptimized
                      className="h-14 w-20 shrink-0 rounded-[var(--radius-sm)] object-cover sm:w-24"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-20 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary/60 sm:w-24"
                    >
                      <ImageOff className="size-5" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate font-heading text-base font-semibold text-ink">
                        {campana.titulo}
                      </h2>
                      {campana.general ? <Chip tono="info">General</Chip> : null}
                      {!campana.activa ? (
                        <Chip tono="neutro">Cerrada</Chip>
                      ) : vencida ? (
                        <Chip tono="warn">Fecha límite pasada</Chip>
                      ) : (
                        <Chip tono="ok">Activa</Chip>
                      )}
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {campana.general
                        ? `Desde ${formatFecha(campana.fechaInicio)}`
                        : campana.fechaFin
                          ? `Vence el ${formatFecha(campana.fechaFin)}`
                          : "Sin fecha límite"}
                    </p>
                  </div>

                  {!campana.general ? (
                    <div className="hidden w-40 shrink-0 sm:block lg:w-56">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-ink-soft">
                          {formatQuetzales(suma)} de {formatQuetzales(meta)}
                        </span>
                        <span className="font-heading text-sm font-semibold text-ink">
                          {avance}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={avance}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Avance de la meta de ${campana.titulo}`}
                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-sky ring-1 ring-line"
                      >
                        <div
                          className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-green"
                          style={{ width: `${avance}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="hidden shrink-0 text-xs text-ink-soft sm:block">
                      {formatQuetzales(suma)} recaudados
                    </p>
                  )}

                  {!campana.general ? (
                    <span className="shrink-0 font-heading text-sm font-semibold text-ink sm:hidden">
                      {avance}%
                    </span>
                  ) : null}

                  <MenuAcciones
                    id={menu}
                    etiqueta={`Acciones de la campaña ${campana.titulo}`}
                    titulo={campana.titulo}
                  >
                    <EnlaceMenu href={`/admin/campanas/${campana.id}/metricas`}>
                      <ChartLine aria-hidden="true" className="size-4" />
                      Ver métricas
                    </EnlaceMenu>
                    <EnlaceMenu
                      href={rutaCampana(campana.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink aria-hidden="true" className="size-4" />
                      Abrir enlace público
                    </EnlaceMenu>
                    {gestiona ? (
                      <>
                        <EnlaceMenu href={`/admin/campanas/${campana.id}`}>
                          Editar
                        </EnlaceMenu>
                        {!campana.general ? (
                          <>
                            <form action={alternarCampana}>
                              <input type="hidden" name="id" value={campana.id} />
                              <OpcionMenu tono={campana.activa ? "peligro" : "normal"}>
                                {campana.activa ? "Cerrar la campaña" : "Reabrir la campaña"}
                              </OpcionMenu>
                            </form>
                            <OpcionConfirmada
                              menu={menu}
                              etiqueta="Eliminar la campaña"
                              mensaje="Se borran sus fotos y deja de verse en el panel y en la portada. Sus aportes y lo recaudado se conservan en los informes."
                              confirmar="Eliminar"
                              accion={eliminarCampana}
                              tono="peligro"
                            >
                              <input type="hidden" name="id" value={campana.id} />
                            </OpcionConfirmada>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </MenuAcciones>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
