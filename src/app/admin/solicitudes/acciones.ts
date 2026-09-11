"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  filaAuditoria,
  registrarAuditoria,
  requirePermiso,
} from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { formatFecha } from "@/lib/fechas";

/**
 * La bandeja de entrantes se resuelve con dos decisiones: aceptar —que abre el
 * proceso de inscripción— o eliminar. Archivar sigue existiendo para el
 * historial de Inscripciones, que es de donde se usa.
 */

/** Lo que la bandeja muestra en la barra lateral y en Inscripciones. */
function refrescarBandeja() {
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/inscripciones");
  // El contador de pendientes de la barra lateral se arma en el layout.
  revalidatePath("/admin", "layout");
}

async function cambiarArchivado(datos: FormData, archivar: boolean) {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const solicitud = await prisma.supportRequest.findUnique({
    where: { id },
    select: { id: true, nombreNino: true, archivada: true },
  });
  if (!solicitud || solicitud.archivada === archivar) return;

  await prisma.supportRequest.update({
    where: { id },
    data: { archivada: archivar },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "SupportRequest",
    entidadId: id,
    detalle: `Solicitud de ${solicitud.nombreNino} ${archivar ? "archivada" : "devuelta a la bandeja"}`,
  });

  refrescarBandeja();
}

/**
 * Archivar no borra ni resuelve: saca la solicitud de las listas de trabajo y
 * la deja en el historial. Se puede en cualquier momento —también sin atender,
 * que es como se descartan duplicados y envíos de prueba— y siempre se puede
 * devolver a la bandeja, para que un clic de más no esconda a un niño.
 */
export async function archivarSolicitud(datos: FormData) {
  await cambiarArchivado(datos, true);
}

export async function restaurarSolicitud(datos: FormData) {
  await cambiarArchivado(datos, false);
}

/**
 * Aceptar no crea el expediente: lo empieza. Deja la solicitud en revisión —así
 * ya no aparece como sin atender mientras se trabaja— y lleva a la papeleta de
 * Inscripciones, que es donde se llena la ficha y de donde nace el expediente.
 */
export async function aceptarSolicitudEntrante(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const solicitud = await prisma.supportRequest.findUnique({
    where: { id },
    select: { id: true, nombreNino: true, estado: true, beneficiarioId: true },
  });
  if (!solicitud) return;

  // Ya aceptada: no se empieza de nuevo, se va al expediente que salió de ella.
  if (solicitud.beneficiarioId) {
    redirect(`/admin/beneficiarios/${solicitud.beneficiarioId}`);
  }

  if (solicitud.estado !== "EN_REVISION") {
    await prisma.supportRequest.update({
      where: { id },
      data: { estado: "EN_REVISION", archivada: false },
    });

    await registrarAuditoria({
      actor: usuario.email,
      accion: "ACTUALIZAR",
      entidad: "SupportRequest",
      entidadId: id,
      detalle: `Solicitud de ${solicitud.nombreNino} aceptada: pasa a Inscripciones para llenar la papeleta`,
    });
  }

  refrescarBandeja();
  redirect(`/admin/inscripciones/solicitud/${id}`);
}

/** Campos que se copian a la bitácora: después del borrado no queda otra copia. */
const PARA_BITACORA = {
  id: true,
  nombreNino: true,
  fechaNacimiento: true,
  municipio: true,
  departamento: true,
  encargadoNombre: true,
  encargadoTelefono: true,
  programaSolicitado: true,
  estado: true,
  createdAt: true,
  beneficiarioId: true,
} as const;

type SolicitudBorrada = {
  nombreNino: string;
  fechaNacimiento: Date;
  municipio: string;
  departamento: string;
  encargadoNombre: string;
  encargadoTelefono: string;
  programaSolicitado: string | null;
  estado: string;
  createdAt: Date;
};

/** El detalle es la evidencia: tiene que bastar para reconstruir a quién se borró. */
function evidencia(s: SolicitudBorrada): string {
  return [
    `Solicitud eliminada — ${s.nombreNino}`,
    `nació el ${formatFecha(s.fechaNacimiento)}`,
    `${s.municipio}, ${s.departamento}`,
    `encargado ${s.encargadoNombre} (${s.encargadoTelefono})`,
    `programa ${s.programaSolicitado ?? "sin preferencia"}`,
    `estado ${s.estado}`,
    `recibida el ${formatFecha(s.createdAt)}`,
  ].join(" · ");
}

/**
 * Eliminar sí borra: la solicitud desaparece de la base y lo único que queda es
 * la entrada de bitácora. Por eso el borrado y su evidencia van en la misma
 * transacción, y por eso una solicitud que ya abrió expediente no se toca:
 * es el formulario del que salió el niño que hoy está inscrito.
 */
export async function eliminarSolicitud(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const solicitud = await prisma.supportRequest.findUnique({
    where: { id },
    select: PARA_BITACORA,
  });
  if (!solicitud || solicitud.beneficiarioId) return;

  const fila = await filaAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "SupportRequest",
    entidadId: solicitud.id,
    detalle: evidencia(solicitud),
  });

  await prisma.$transaction([
    prisma.auditLog.create({ data: fila }),
    prisma.supportRequest.delete({ where: { id } }),
  ]);

  refrescarBandeja();
}

/**
 * Vaciar la bandeja de una vez. Alcanza exactamente lo que la bandeja enseña
 * —lo entrante sin atender—, así que no se lleva por delante una solicitud que
 * alguien ya aceptó y está inscribiendo. Escribe una entrada por solicitud, no
 * un resumen, para que después se pueda buscar a cada niño por su propio id.
 */
export async function eliminarBandejaSolicitudes() {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const solicitudes = await prisma.supportRequest.findMany({
    where: { archivada: false, estado: "NUEVA", beneficiarioId: null },
    select: PARA_BITACORA,
  });
  if (solicitudes.length === 0) return;

  const filas = await Promise.all(
    solicitudes.map((solicitud) =>
      filaAuditoria({
        actor: usuario.email,
        accion: "ELIMINAR",
        entidad: "SupportRequest",
        entidadId: solicitud.id,
        detalle: `${evidencia(solicitud)} · vaciado de la bandeja (${solicitudes.length} en total)`,
      }),
    ),
  );

  await prisma.$transaction([
    prisma.auditLog.createMany({ data: filas }),
    prisma.supportRequest.deleteMany({
      where: { id: { in: solicitudes.map((s) => s.id) } },
    }),
  ]);

  refrescarBandeja();
}
