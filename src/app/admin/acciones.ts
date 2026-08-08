"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";

const esquemaEstado = z.object({
  id: z.string().min(1),
  estado: z.enum(["NUEVA", "EN_REVISION", "APROBADA", "RECHAZADA"]),
});

/** Cambia el estado de una inscripción de beneficiario recibida del sitio. */
export async function cambiarEstadoSolicitud(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_LEER);
  const parseo = esquemaEstado.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return;

  const solicitud = await prisma.supportRequest.update({
    where: { id: parseo.data.id },
    data: { estado: parseo.data.estado },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "SupportRequest",
    entidadId: solicitud.id,
    detalle: `Solicitud de ${solicitud.nombreNino} marcada como ${parseo.data.estado}`,
  });

  revalidatePath("/admin/solicitudes");
}

export async function cambiarEstadoPostulacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_LEER);
  const parseo = esquemaEstado.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return;

  const postulacion = await prisma.volunteerApplication.update({
    where: { id: parseo.data.id },
    data: { estado: parseo.data.estado },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "VolunteerApplication",
    entidadId: postulacion.id,
    detalle: `Postulación de ${postulacion.nombre} marcada como ${parseo.data.estado}`,
  });

  revalidatePath("/admin/voluntarios");
}

export async function cambiarEstadoMensaje(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_LEER);
  const parseo = esquemaEstado.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return;

  const mensaje = await prisma.contactMessage.update({
    where: { id: parseo.data.id },
    data: { estado: parseo.data.estado },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "ContactMessage",
    entidadId: mensaje.id,
    detalle: `Mensaje «${mensaje.asunto}» marcado como ${parseo.data.estado}`,
  });

  revalidatePath("/admin/mensajes");
}
