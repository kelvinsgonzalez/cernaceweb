import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, ChipSolicitud } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { SelectorEstado } from "@/components/admin/selector-estado";
import { formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { cambiarEstadoPostulacion } from "../acciones";

export const metadata: Metadata = { title: "Voluntarios y postulaciones" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Postulante",
  "Tipo",
  "Contacto",
  "Aporte / disponibilidad",
  "Recibida",
  "Estado",
  "Cambiar estado",
];

export default async function VoluntariosPage() {
  await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const postulaciones = await prisma.volunteerApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Voluntarios y postulaciones"
        descripcion="Formularios de inscripción de padrinos y de voluntariado recibidos desde el sitio público."
      />

      <Tabla
        caption="Postulaciones de padrinos y voluntarios recibidas desde el sitio público"
        columnas={COLUMNAS}
      >
        {postulaciones.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay postulaciones." />
        ) : (
          postulaciones.map((postulacion) => (
            <Fila key={postulacion.id}>
              <Celda>
                <span className="font-medium">{postulacion.nombre}</span>
                {postulacion.ocupacion ? (
                  <span className="block text-xs text-ink-soft">
                    {postulacion.ocupacion}
                  </span>
                ) : null}
              </Celda>
              <Celda>
                {postulacion.tipo === "PADRINO" ? (
                  <Chip tono="info">Padrino</Chip>
                ) : (
                  <Chip tono="neutro">Voluntario</Chip>
                )}
              </Celda>
              <Celda>
                <span className="block">{postulacion.email}</span>
                <span className="block text-xs text-ink-soft">
                  {postulacion.telefono}
                </span>
              </Celda>
              <Celda>
                {postulacion.aporteMensual
                  ? formatQuetzales(aNumero(postulacion.aporteMensual))
                  : (postulacion.disponibilidad ?? "—")}
              </Celda>
              <Celda className="whitespace-nowrap">
                {formatFecha(postulacion.createdAt)}
              </Celda>
              <Celda>
                <ChipSolicitud estado={postulacion.estado} />
              </Celda>
              <Celda>
                <SelectorEstado
                  accion={cambiarEstadoPostulacion}
                  id={postulacion.id}
                  estado={postulacion.estado}
                  descripcion={`la postulación de ${postulacion.nombre}`}
                />
              </Celda>
            </Fila>
          ))
        )}
      </Tabla>
    </>
  );
}
