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

export async function cambiarEstadoPostulacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);
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
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);
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
