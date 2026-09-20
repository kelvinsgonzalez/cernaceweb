"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { primerNombre } from "@/lib/utils";

/**
 * Aprobación y equipo responsable. Las dos cosas las hace quien tiene
 * terapia.gestionar: aprobar decide si el niño entra a terapia y con qué
 * objetivo; asignar decide quién puede registrarle avances.
 */

const esquemaPlan = z.object({
  beneficiarioId: z.string().min(1),
  objetivoGeneral: z
    .string()
    .trim()
    .min(15, "Escribe el objetivo general del tratamiento."),
  anotaciones: z.string().trim().optional(),
  fechaAprobacion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de aprobación."),
  activo: z.string().optional(),
});

export async function guardarPlan(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.TERAPIA_GESTIONAR);

  const parseo = esquemaPlan.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, nombres: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const activo = v.activo === "on";
  const comun = {
    objetivoGeneral: v.objetivoGeneral,
    anotaciones: v.anotaciones || null,
    activo,
    aprobadoPor: usuario.nombre,
    aprobadoPorId: usuario.id,
    fechaAprobacion: fechaDesdeInput(v.fechaAprobacion),
  };

  const previo = await prisma.planTerapeutico.findUnique({
    where: { beneficiarioId: beneficiario.id },
    select: { id: true },
  });

  await prisma.planTerapeutico.upsert({
    where: { beneficiarioId: beneficiario.id },
    create: { beneficiarioId: beneficiario.id, ...comun },
    update: comun,
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: previo ? "ACTUALIZAR" : "CREAR",
    entidad: "PlanTerapeutico",
    entidadId: beneficiario.id,
    detalle: `${activo ? "Aprobado" : "Suspendido"} el plan de terapia de ${primerNombre(beneficiario.nombres)} (${beneficiario.codigoExpediente})`,
  });

  revalidatePath("/admin/beneficiarios");
  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);

  return {
    ok: activo
      ? "Plan aprobado. El equipo asignado ya puede registrar avances."
      : "Plan suspendido. No se pueden registrar avances mientras siga así.",
  };
}

const esquemaResponsables = z.object({
  beneficiarioId: z.string().min(1),
  responsables: z.array(z.string().min(1)),
});

export async function asignarResponsables(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.TERAPIA_GESTIONAR);

  const parseo = esquemaResponsables.safeParse({
    beneficiarioId: datos.get("beneficiarioId"),
    responsables: datos.getAll("responsables").map(String).filter(Boolean),
  });
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, nombres: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  // Solo cuentas activas que puedan registrar avances: asignar a alguien sin
  // ese permiso crearía una responsabilidad que no puede ejercer.
  const elegibles = await prisma.user.findMany({
    where: {
      activo: true,
      id: { in: v.responsables },
      roles: {
        some: {
          role: {
            permisos: {
              some: { permission: { clave: PERMISOS.SEGUIMIENTO_ESCRIBIR } },
            },
          },
        },
      },
    },
    select: { id: true, nombre: true },
  });

  if (elegibles.length !== v.responsables.length) {
    return {
      error: "Revisa los campos marcados.",
      errores: {
        responsables:
          "Alguna de las cuentas elegidas ya no está activa o no puede registrar avances.",
      },
    };
  }

  const hoy = new Date();
  const elegidos = new Set(elegibles.map((u) => u.id));

  await prisma.$transaction(async (tx) => {
    const actuales = await tx.asignacionTerapeuta.findMany({
      where: { beneficiarioId: beneficiario.id },
      select: { id: true, terapeutaId: true, activo: true },
    });

    // Las asignaciones no se borran: se dan de baja con su fecha, para que el
    // histórico diga quién atendía al niño en cada momento.
    for (const asignacion of actuales) {
      const sigue = elegidos.has(asignacion.terapeutaId);
      if (sigue === asignacion.activo) continue;
      await tx.asignacionTerapeuta.update({
        where: { id: asignacion.id },
        data: sigue
          ? { activo: true, hasta: null, desde: hoy, asignadoPor: usuario.nombre }
          : { activo: false, hasta: hoy },
      });
    }

    const conocidos = new Set(actuales.map((a) => a.terapeutaId));
    for (const id of elegidos) {
      if (conocidos.has(id)) continue;
      await tx.asignacionTerapeuta.create({
        data: {
          beneficiarioId: beneficiario.id,
          terapeutaId: id,
          desde: hoy,
          asignadoPor: usuario.nombre,
        },
      });
    }
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "AsignacionTerapeuta",
    entidadId: beneficiario.id,
    detalle:
      elegibles.length === 0
        ? `${primerNombre(beneficiario.nombres)} se quedó sin responsables asignados`
        : `Responsables de ${primerNombre(beneficiario.nombres)}: ${elegibles.map((u) => u.nombre).join(", ")}`,
  });

  revalidatePath("/admin/beneficiarios");
  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);

  return {
    ok:
      elegibles.length === 0
        ? "Se retiraron todos los responsables."
        : `Equipo actualizado: ${elegibles.length} ${elegibles.length === 1 ? "responsable" : "responsables"}.`,
  };
}
