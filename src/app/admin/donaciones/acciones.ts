"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { esMetodoPago, generarReferencia } from "@/lib/pasarela";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";

/**
 * Un aporte no lo aprueba ninguna pasarela: lo aprueba quien coteja la foto
 * del comprobante contra el estado de cuenta. Hasta entonces sigue PENDIENTE,
 * sin monto, y no suma en el total recaudado. Al aprobar se anota el monto y
 * el método, se empareja con el niño si hace falta y se decide si el mensaje
 * de amor llega a la familia. Al rechazar se escribe el motivo, que el
 * padrino lee en su portal.
 */

function refrescar(id?: string) {
  revalidatePath("/admin/donaciones");
  if (id) revalidatePath(`/admin/donaciones/${id}`);
  revalidatePath("/admin/donaciones/reportes");
  revalidatePath("/admin/campanas");
  revalidatePath("/admin/asignaciones");
  revalidatePath("/admin");
  revalidatePath("/portal");
  revalidatePath("/portal/aportes");
  revalidatePath("/mi-expediente");
}

/**
 * El compromiso vigente entre ese padrino y ese niño, si lo hay: es lo que
 * convierte un aporte suelto en un aporte de apadrinamiento.
 */
async function compromisoDe(padrinoId: string | null, beneficiarioId: string) {
  if (!padrinoId) return null;
  return prisma.padrinazgo.findFirst({
    where: { padrinoId, beneficiarioId, activo: true },
    select: { id: true },
  });
}

export async function verificarDonacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  const aprobar = String(datos.get("decision") ?? "") === "APROBAR";
  const nota = String(datos.get("notaVerificacion") ?? "")
    .trim()
    .slice(0, 500);
  const metodo = String(datos.get("metodo") ?? "").trim();
  const beneficiarioElegido = String(datos.get("beneficiarioId") ?? "").trim();
  const publicarMensaje = String(datos.get("publicarMensaje") ?? "") === "si";

  if (!id) return;

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      monto: true,
      metodo: true,
      mensaje: true,
      tipo: true,
      padrinoId: true,
      beneficiarioId: true,
      padrinazgoId: true,
      referenciaPasarela: true,
      donanteNombre: true,
    },
  });
  if (!donacion) redirect("/admin/donaciones");
  if (donacion.estado !== "PENDIENTE") redirect(`/admin/donaciones/${id}`);

  // Al rechazar, el motivo es obligatorio: es lo que el padrino va a leer.
  if (!aprobar && !nota) {
    redirect(`/admin/donaciones/${id}?falta=nota`);
  }

  // El aporte llega sin monto: quien lo envía solo sube la foto. Aprobarlo sin
  // anotarlo lo haría sumar cero, así que se pide aquí. Si ya traía monto
  // (registrado a mano) se puede corregir.
  let monto = donacion.monto;
  if (aprobar) {
    const escrito = String(datos.get("monto") ?? "").trim();
    if (escrito) {
      const numero = Number(escrito);
      if (!Number.isFinite(numero) || numero <= 0) {
        redirect(`/admin/donaciones/${id}?falta=monto`);
      }
      monto = new Prisma.Decimal(numero.toFixed(2));
    }
    if (monto === null) redirect(`/admin/donaciones/${id}?falta=monto`);
  }

  // El niño: si el aporte no traía uno y el admin lo eligió, queda emparejado.
  let beneficiarioId = donacion.beneficiarioId;
  let padrinazgoId = donacion.padrinazgoId;
  let tipo = donacion.tipo;
  if (aprobar && !beneficiarioId && beneficiarioElegido) {
    const nino = await prisma.beneficiario.findUnique({
      where: { id: beneficiarioElegido },
      select: { id: true },
    });
    if (nino) {
      beneficiarioId = nino.id;
      const compromiso = await compromisoDe(donacion.padrinoId, nino.id);
      if (compromiso) {
        padrinazgoId = compromiso.id;
        tipo = "APADRINAMIENTO";
      }
    }
  }

  await prisma.donacion.update({
    where: { id },
    data: {
      estado: aprobar ? "COMPLETADA" : "FALLIDA",
      monto,
      metodo: aprobar && esMetodoPago(metodo) ? metodo : donacion.metodo,
      beneficiarioId,
      padrinazgoId,
      tipo,
      mensajeVisibleFamilia: aprobar && publicarMensaje && Boolean(donacion.mensaje),
      verificadaPor: usuario.nombre,
      verificadaEn: new Date(),
      notaVerificacion: nota || null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: aprobar ? "PAGO_APROBADO" : "PAGO_RECHAZADO",
    entidad: "Donacion",
    entidadId: id,
    detalle: `Aporte de ${donacion.donanteNombre ?? "donante sin identificar"} ${aprobar ? `aprobado por ${formatQuetzales(aNumero(monto))}` : "rechazado"} · referencia ${donacion.referenciaPasarela}${nota ? ` · ${nota}` : ""}${aprobar && publicarMensaje && donacion.mensaje ? " · mensaje publicado a la familia" : ""}`,
  });

  refrescar(id);
  redirect(`/admin/donaciones/${id}`);
}

/**
 * Deshacer la verificación: devuelve el aporte a pendiente para que se revise
 * otra vez. Un clic de más no debe dejar un aporte real marcado como fallido
 * sin salida. El mensaje de amor deja de verse mientras tanto.
 */
export async function reabrirDonacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: { id: true, estado: true, referenciaPasarela: true },
  });
  if (!donacion) redirect("/admin/donaciones");
  if (donacion.estado === "PENDIENTE") redirect(`/admin/donaciones/${id}`);

  await prisma.donacion.update({
    where: { id },
    data: {
      estado: "PENDIENTE",
      mensajeVisibleFamilia: false,
      verificadaPor: null,
      verificadaEn: null,
      notaVerificacion: null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Donacion",
    entidadId: id,
    detalle: `Aporte devuelto a pendiente para revisarlo de nuevo · referencia ${donacion.referenciaPasarela}`,
  });

  refrescar(id);
  redirect(`/admin/donaciones/${id}`);
}

/**
 * Publicar o retirar el mensaje de amor de un aporte ya aprobado, sin tocar
 * nada más. La familia lo ve en Mi expediente solo mientras esté publicado.
 */
export async function alternarMensajeFamilia(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      mensaje: true,
      mensajeVisibleFamilia: true,
      referenciaPasarela: true,
    },
  });
  if (!donacion) redirect("/admin/donaciones");
  if (donacion.estado !== "COMPLETADA" || !donacion.mensaje) {
    redirect(`/admin/donaciones/${id}`);
  }

  const publicar = !donacion.mensajeVisibleFamilia;
  await prisma.donacion.update({
    where: { id },
    data: { mensajeVisibleFamilia: publicar },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Donacion",
    entidadId: id,
    detalle: `Mensaje de amor ${publicar ? "publicado a la familia" : "retirado"} · referencia ${donacion.referenciaPasarela}`,
  });

  refrescar(id);
  redirect(`/admin/donaciones/${id}`);
}

const esquemaManual = z.object({
  destino: z
    .string()
    .regex(/^(P|C):.+$/, "Elige a qué va el aporte."),
  monto: z
    .string()
    .trim()
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Escribe el monto en quetzales.",
    }),
  metodo: z.string().refine(esMetodoPago, { message: "Elige el método." }),
  nota: z.string().trim().max(300, "La nota es demasiado larga.").optional(),
});

/**
 * Aporte registrado a mano por el administrador: efectivo en la oficina, o un
 * padrino que depositó y nunca subió la foto. Nace aprobado, porque lo anota
 * quien ya cotejó el dinero, y queda fechado hoy: el mes del aporte es el mes
 * en que se registra.
 */
export async function registrarAporteManual(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const parseo = esquemaManual.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const [clase, destinoId] = v.destino.split(":", 2);
  const monto = new Prisma.Decimal(Number(v.monto).toFixed(2));
  const ahora = new Date();

  let creado: { id: string; referenciaPasarela: string };
  let detalle: string;

  if (clase === "P") {
    const compromiso = await prisma.padrinazgo.findUnique({
      where: { id: destinoId },
      select: {
        id: true,
        activo: true,
        padrino: { select: { id: true, nombre: true, email: true } },
        beneficiario: { select: { id: true, codigoExpediente: true, nombres: true } },
      },
    });
    if (!compromiso?.activo) {
      return { errores: { destino: "Ese apadrinamiento ya no está vigente." } };
    }
    creado = await prisma.donacion.create({
      data: {
        tipo: "APADRINAMIENTO",
        padrinoId: compromiso.padrino.id,
        beneficiarioId: compromiso.beneficiario.id,
        padrinazgoId: compromiso.id,
        donanteNombre: compromiso.padrino.nombre,
        donanteEmail: compromiso.padrino.email,
        monto,
        metodo: v.metodo,
        estado: "COMPLETADA",
        referenciaPasarela: generarReferencia(),
        verificadaPor: usuario.nombre,
        verificadaEn: ahora,
        notaVerificacion: v.nota ? `Registrado a mano: ${v.nota}` : "Registrado a mano.",
      },
      select: { id: true, referenciaPasarela: true },
    });
    detalle = `Aporte registrado a mano: ${compromiso.padrino.nombre} → ${compromiso.beneficiario.codigoExpediente} por ${formatQuetzales(aNumero(monto))}`;
  } else {
    const campana = await prisma.campaign.findUnique({
      where: { id: destinoId },
      select: { id: true, titulo: true, general: true, activa: true, eliminadaEn: true },
    });
    if (!campana || campana.eliminadaEn) {
      return { errores: { destino: "Esa campaña ya no existe." } };
    }
    creado = await prisma.donacion.create({
      data: {
        tipo: campana.general ? "GENERAL" : "CAMPANA",
        campaignId: campana.id,
        donanteNombre: v.nota || "Registrado por el equipo",
        monto,
        metodo: v.metodo,
        estado: "COMPLETADA",
        referenciaPasarela: generarReferencia(),
        verificadaPor: usuario.nombre,
        verificadaEn: ahora,
        notaVerificacion: "Registrado a mano.",
      },
      select: { id: true, referenciaPasarela: true },
    });
    detalle = `Aporte registrado a mano a «${campana.titulo}» por ${formatQuetzales(aNumero(monto))}`;
  }

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Donacion",
    entidadId: creado.id,
    detalle: `${detalle} · referencia ${creado.referenciaPasarela}`,
  });

  refrescar(creado.id);
  return { ok: `Aporte registrado con la referencia ${creado.referenciaPasarela}.` };
}
