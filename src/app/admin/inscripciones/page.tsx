import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  Chip,
  ChipSolicitud,
  Tarjeta,
  TarjetaCabecera,
  Vacio,
} from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import {
  EnlaceMenu,
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import { calcularEdad, formatFecha } from "@/lib/fechas";
import { archivarSolicitud, restaurarSolicitud } from "../solicitudes/acciones";

export const metadata: Metadata = { title: "Inscripciones" };

export const dynamic = "force-dynamic";

export default async function InscripcionesPage() {
  const usuario = await requirePermiso(PERMISOS.INSCRIPCIONES_LEER);
  const puedeInscribir = tienePermiso(usuario, PERMISOS.EXPEDIENTE_ESCRIBIR);
  // Las solicitudes son de otra bandeja: se listan aquí porque es donde se
  // inscriben, pero solo a quien puede atenderlas.
  const puedeAtender = tienePermiso(usuario, PERMISOS.SOLICITUDES_ATENDER);

  const [solicitudes, archivadas] = await Promise.all([
    // Aquí solo entra lo aceptado en Solicitudes. Una entrante que nadie ha
    // aceptado todavía no es candidata a inscribirse, y una eliminada ya no
    // existe: solo queda su registro en la bitácora.
    puedeAtender
      ? prisma.supportRequest.findMany({
          where: {
            archivada: false,
            beneficiarioId: null,
            estado: "EN_REVISION",
          },
          orderBy: { createdAt: "asc" },
        })
      : [],
    puedeAtender
      ? prisma.supportRequest.findMany({
          where: { archivada: true },
          orderBy: { updatedAt: "desc" },
          include: {
            beneficiario: { select: { id: true, codigoExpediente: true } },
          },
        })
      : [],
  ]);

  return (
    <>
      <EncabezadoPagina titulo="Inscripciones" />

      {puedeAtender ? (
        <Tarjeta>
          <TarjetaCabecera
            titulo="Solicitudes aceptadas pendientes de inscribir"
            acciones={
              <Chip tono={solicitudes.length > 0 ? "warn" : "ok"}>
                {solicitudes.length} sin inscribir
              </Chip>
            }
          />
          {solicitudes.length === 0 ? (
            <Vacio mensaje="No hay solicitudes aceptadas esperando. Las entrantes se aceptan desde Solicitudes y aparecen aquí." />
          ) : (
            <ul className="divide-y divide-line">
              {solicitudes.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-ink">{s.nombreNino}</p>
                    <p className="text-xs text-ink-soft">
                      {calcularEdad(s.fechaNacimiento)} años · {s.municipio},{" "}
                      {s.departamento} · {s.encargadoNombre} (
                      {s.encargadoParentesco}) · recibida el{" "}
                      {formatFecha(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <MenuAcciones
                      id={s.id}
                      etiqueta={`Acciones de la solicitud de ${s.nombreNino}`}
                      titulo={s.nombreNino}
                    >
                      {puedeInscribir ? (
                        <EnlaceMenu
                          href={`/admin/inscripciones/solicitud/${s.id}`}
                        >
                          Llenar papeleta
                        </EnlaceMenu>
                      ) : null}
                      <OpcionConfirmada
                        menu={s.id}
                        tono="peligro"
                        etiqueta="Archivar"
                        mensaje={`La solicitud de ${s.nombreNino} sale de esta bandeja y ya no se podrá inscribir desde aquí. Solo se revierte devolviéndola desde el historial de archivadas.`}
                        confirmar="Sí, archivar"
                        accion={archivarSolicitud}
                      >
                        <input type="hidden" name="id" value={s.id} />
                      </OpcionConfirmada>
                    </MenuAcciones>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      ) : null}

      {puedeAtender && archivadas.length > 0 ? (
        <details className="mt-8">
          <summary className="cursor-pointer font-heading text-xl font-semibold text-ink">
            Historial de solicitudes archivadas ({archivadas.length})
          </summary>
          <Tarjeta className="mt-4">
            <ul className="divide-y divide-line">
              {archivadas.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-ink">{s.nombreNino}</p>
                    <p className="text-xs text-ink-soft">
                      {s.municipio}, {s.departamento} · recibida el{" "}
                      {formatFecha(s.createdAt)}
                      {s.beneficiario ? (
                        <>
                          {" · "}
                          <Link
                            href={`/admin/beneficiarios/${s.beneficiario.id}`}
                            className="text-brand-primary hover:underline"
                          >
                            {s.beneficiario.codigoExpediente}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ChipSolicitud estado={s.estado} />
                    <form action={restaurarSolicitud}>
                      <input type="hidden" name="id" value={s.id} />
                      <Boton
                        type="submit"
                        variante="contorno"
                        className="px-3 py-1.5 text-xs"
                      >
                        Devolver a la bandeja
                        <span className="visually-hidden">
                          {" "}
                          la solicitud de {s.nombreNino}
                        </span>
                      </Boton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </details>
      ) : null}
    </>
  );
}
