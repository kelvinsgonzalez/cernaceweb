import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { ChipSolicitud, Kpi } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { SelectorEstado } from "@/components/admin/selector-estado";
import { calcularEdad, formatFecha } from "@/lib/fechas";
import { cambiarEstadoSolicitud } from "../acciones";

export const metadata: Metadata = { title: "Solicitudes de inscripción" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Niño o adolescente",
  "Edad",
  "Procedencia",
  "Encargado",
  "Programa solicitado",
  "Recibida",
  "Estado",
  "Cambiar estado",
];

export default async function SolicitudesPage() {
  await requirePermiso(PERMISOS.EXPEDIENTE_LEER);

  const [solicitudes, nuevas, enRevision] = await Promise.all([
    prisma.supportRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.supportRequest.count({ where: { estado: "NUEVA" } }),
    prisma.supportRequest.count({ where: { estado: "EN_REVISION" } }),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Solicitudes de inscripción"
        descripcion="Formularios de inscripción de beneficiarios enviados desde el sitio público."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Total recibidas" valor={solicitudes.length} />
        <Kpi etiqueta="Sin revisar" valor={nuevas} />
        <Kpi etiqueta="En revisión" valor={enRevision} />
      </div>

      <div className="mt-8">
        <Tabla
          caption="Solicitudes de inscripción de beneficiarios recibidas desde el sitio público"
          columnas={COLUMNAS}
        >
          {solicitudes.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="Todavía no se ha recibido ninguna solicitud."
            />
          ) : (
            solicitudes.map((solicitud) => (
              <Fila key={solicitud.id}>
                <Celda>
                  <span className="font-medium">{solicitud.nombreNino}</span>
                  {solicitud.diagnostico ? (
                    <span className="block text-xs text-ink-soft">
                      {solicitud.diagnostico}
                    </span>
                  ) : null}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {calcularEdad(solicitud.fechaNacimiento)} años
                  <span className="block text-xs text-ink-soft">
                    Nació el {formatFecha(solicitud.fechaNacimiento)}
                  </span>
                </Celda>
                <Celda>
                  {solicitud.municipio}
                  <span className="block text-xs text-ink-soft">
                    {solicitud.departamento}
                  </span>
                </Celda>
                <Celda>
                  <span className="block">{solicitud.encargadoNombre}</span>
                  <span className="block text-xs text-ink-soft">
                    {solicitud.encargadoParentesco} · {solicitud.encargadoTelefono}
                  </span>
                </Celda>
                <Celda>{solicitud.programaSolicitado ?? "Sin preferencia"}</Celda>
                <Celda className="whitespace-nowrap">
                  {formatFecha(solicitud.createdAt)}
                </Celda>
                <Celda>
                  <ChipSolicitud estado={solicitud.estado} />
                </Celda>
                <Celda>
                  <SelectorEstado
                    accion={cambiarEstadoSolicitud}
                    id={solicitud.id}
                    estado={solicitud.estado}
                    descripcion={`la solicitud de ${solicitud.nombreNino}`}
                  />
                </Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>
    </>
  );
}
