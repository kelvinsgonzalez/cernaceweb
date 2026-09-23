"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermiso, registrarAuditoria } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { primerNombre } from "@/lib/utils";

/**
 * El compromiso de un padrino con un niño: un aporte mensual de referencia,
 * una fecha de inicio y, si se quiere, una caducidad. Sin cuotas: el aporte es
 * voluntario. Todo esto lo ve y lo decide solo la administración.
 */

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha.");

const esquemaAsignacion = z
  .object({
    padrinoId: z.string().min(1, "Elige un padrino."),
    beneficiarioId: z.string().min(1, "Elige un beneficiario."),
    aporteMensual: z
      .string()
      .trim()
      .refine((v) => Number(v) >= 50, "El aporte de referencia mínimo es de Q50."),
    fechaInicio: fecha,
    caducaEl: z.union([fecha, z.literal("")]).optional(),
  })
  .refine((v) => !v.caducaEl || v.caducaEl > v.fechaInicio, {
    message: "La caducidad tiene que ser posterior al inicio.",
    path: ["caducaEl"],
  });

function refrescar(beneficiarioId?: string) {
  revalidatePath("/admin/asignaciones");
  revalidatePath("/admin/donantes");
  revalidatePath("/admin");
  revalidatePath("/portal");
  if (beneficiarioId) revalidatePath(`/admin/beneficiarios/${beneficiarioId}`);
}

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
    activo: true,
    fechaInicio: fechaDesdeInput(v.fechaInicio),
    fechaFin: null,
    caducaEl: v.caducaEl ? fechaDesdeInput(v.caducaEl) : null,
    avancesSuspendidos: false,
    avisoAtendidoEl: null,
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
    detalle: `${primerNombre(beneficiario.nombres)} asignado a ${padrino.nombre} con referencia de Q${v.aporteMensual} al mes${v.caducaEl ? ` · caduca el ${v.caducaEl}` : ""}`,
  });

  refrescar(v.beneficiarioId);

  return {
    ok: `${primerNombre(beneficiario.nombres)} quedó asignado a ${padrino.nombre}.`,
  };
}

async function padrinazgoDe(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  if (!id) return null;
  return prisma.padrinazgo.findUnique({
    where: { id },
    select: {
      id: true,
      beneficiarioId: true,
      avancesSuspendidos: true,
      padrino: { select: { nombre: true } },
      beneficiario: { select: { nombres: true } },
    },
  });
}

export async function finalizarPadrinazgo(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);
  const padrinazgo = await padrinazgoDe(datos);
  if (!padrinazgo) return;

  await prisma.padrinazgo.update({
    where: { id: padrinazgo.id },
    data: { activo: false, fechaFin: new Date(), avancesSuspendidos: false },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.beneficiarioId,
    detalle: `Se dio por terminado el apadrinamiento de ${primerNombre(padrinazgo.beneficiario.nombres)} por ${padrinazgo.padrino.nombre}`,
  });

  refrescar(padrinazgo.beneficiarioId);
}

/**
 * «Mantener»: el administrador vio el aviso de seis meses sin aporte y decide
 * dejar el compromiso como está. El aviso no vuelve hasta dentro de otros
 * seis meses, salvo que llegue un aporte, que lo apaga solo.
 */
export async function mantenerCompromiso(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);
  const padrinazgo = await padrinazgoDe(datos);
  if (!padrinazgo) return;

  await prisma.padrinazgo.update({
    where: { id: padrinazgo.id },
    data: { avisoAtendidoEl: new Date() },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.beneficiarioId,
    detalle: `Compromiso de ${padrinazgo.padrino.nombre} con ${primerNombre(padrinazgo.beneficiario.nombres)} mantenido tras seis meses sin aporte`,
  });

  refrescar(padrinazgo.beneficiarioId);
}

/**
 * Suspender o reactivar los avances. Suspendido, el padrino sigue asignado
 * pero en el portal solo ve el recordatorio y el botón de aportar.
 */
export async function alternarAvances(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);
  const padrinazgo = await padrinazgoDe(datos);
  if (!padrinazgo) return;

  const suspender = !padrinazgo.avancesSuspendidos;
  await prisma.padrinazgo.update({
    where: { id: padrinazgo.id },
    data: {
      avancesSuspendidos: suspender,
      avisoAtendidoEl: suspender ? new Date() : padrinazgo.avancesSuspendidos ? null : undefined,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.beneficiarioId,
    detalle: `Avances de ${primerNombre(padrinazgo.beneficiario.nombres)} ${suspender ? "suspendidos" : "reactivados"} para ${padrinazgo.padrino.nombre}`,
  });

  refrescar(padrinazgo.beneficiarioId);
}

/** Cambiar o quitar la caducidad de un compromiso vigente. */
export async function cambiarCaducidad(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);
  const padrinazgo = await padrinazgoDe(datos);
  if (!padrinazgo) return;

  const valor = String(datos.get("caducaEl") ?? "").trim();
  const caducaEl = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? fechaDesdeInput(valor) : null;

  await prisma.padrinazgo.update({
    where: { id: padrinazgo.id },
    data: { caducaEl },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.beneficiarioId,
    detalle: `Caducidad del compromiso de ${padrinazgo.padrino.nombre} con ${primerNombre(padrinazgo.beneficiario.nombres)} ${caducaEl ? `fijada el ${valor}` : "retirada"}`,
  });

  refrescar(padrinazgo.beneficiarioId);
}
