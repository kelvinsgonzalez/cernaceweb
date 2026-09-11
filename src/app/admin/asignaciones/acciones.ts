"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermiso, registrarAuditoria } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { primerNombre } from "@/lib/utils";

const esquemaAsignacion = z.object({
  padrinoId: z.string().min(1, "Elige un padrino."),
  beneficiarioId: z.string().min(1, "Elige un beneficiario."),
  aporteMensual: z
    .string()
    .trim()
    .refine((v) => Number(v) >= 50, "El aporte mínimo es de Q50."),
  modalidad: z.enum(["MENSUAL", "TRIMESTRAL", "ANUAL", "UNICO"], {
    message: "Elige la modalidad.",
  }),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de inicio."),
});

export async function asignarPadrinazgo(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);

  const parseo = esquemaAsignacion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;

  const [padrino, beneficiario] = await Promise.all([
    prisma.padrino.findUnique({
      where: { id: v.padrinoId },
      select: { id: true, nombre: true, activo: true },
    }),
    prisma.beneficiario.findUnique({
      where: { id: v.beneficiarioId },
      select: {
        id: true,
        nombres: true,
        estado: true,
        padrinazgos: { where: { activo: true }, select: { id: true } },
      },
    }),
  ]);

  if (!padrino?.activo) {
    return { errores: { padrinoId: "Ese padrino no está disponible." } };
  }
  if (!beneficiario || beneficiario.estado !== "ACTIVO") {
    return { errores: { beneficiarioId: "Ese beneficiario no está activo." } };
  }
  // Se comprueba de nuevo aquí y no solo al armar el desplegable: entre que se
  // carga la página y se envía el formulario, otra persona pudo asignarlo.
  if (beneficiario.padrinazgos.length > 0) {
    return {
      errores: {
        beneficiarioId: "Ese beneficiario ya tiene un padrino activo.",
      },
    };
  }

  // La tabla es única por par padrino-beneficiario, así que reactivar un
  // padrinazgo anterior no puede hacerse con un create.
  const previo = await prisma.padrinazgo.findUnique({
    where: {
      padrinoId_beneficiarioId: {
        padrinoId: v.padrinoId,
        beneficiarioId: v.beneficiarioId,
      },
    },
    select: { id: true },
  });

  const datosPadrinazgo = {
    aporteMensual: v.aporteMensual,
    modalidad: v.modalidad,
    activo: true,
    fechaInicio: fechaDesdeInput(v.fechaInicio),
    fechaFin: null,
  };

  if (previo) {
    await prisma.padrinazgo.update({
      where: { id: previo.id },
      data: datosPadrinazgo,
    });
  } else {
    await prisma.padrinazgo.create({
      data: {
        padrinoId: v.padrinoId,
        beneficiarioId: v.beneficiarioId,
        ...datosPadrinazgo,
      },
    });
  }

  await registrarAuditoria({
    actor: usuario.email,
    accion: previo ? "ACTUALIZAR" : "CREAR",
    entidad: "Padrinazgo",
    entidadId: v.beneficiarioId,
    detalle: `${primerNombre(beneficiario.nombres)} asignado a ${padrino.nombre} por Q${v.aporteMensual} (${v.modalidad.toLowerCase()})`,
  });

  revalidatePath("/admin/asignaciones");
  revalidatePath("/admin/donantes");
  revalidatePath(`/admin/beneficiarios/${v.beneficiarioId}`);

  return {
    ok: `${primerNombre(beneficiario.nombres)} quedó asignado a ${padrino.nombre}.`,
  };
}

export async function finalizarPadrinazgo(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const padrinazgo = await prisma.padrinazgo.findUnique({
    where: { id },
    select: {
      id: true,
      beneficiarioId: true,
      padrino: { select: { nombre: true } },
      beneficiario: { select: { nombres: true } },
    },
  });
  if (!padrinazgo) return;

  await prisma.padrinazgo.update({
    where: { id },
    data: { activo: false, fechaFin: new Date() },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.beneficiarioId,
    detalle: `Se dio por terminado el apadrinamiento de ${primerNombre(padrinazgo.beneficiario.nombres)} por ${padrinazgo.padrino.nombre}`,
  });

  revalidatePath("/admin/asignaciones");
  revalidatePath("/admin/donantes");
  revalidatePath(`/admin/beneficiarios/${padrinazgo.beneficiarioId}`);
}
