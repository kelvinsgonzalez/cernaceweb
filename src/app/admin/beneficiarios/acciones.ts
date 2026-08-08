"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";

const esquemaDatosGenerales = z.object({
  id: z.string().min(1),
  nombres: z.string().trim().min(2, "Escribe los nombres."),
  apellidos: z.string().trim().min(2, "Escribe los apellidos."),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  sexo: z.enum(["MASCULINO", "FEMENINO"]),
  cui: z.string().trim().optional(),
  lugarNacimiento: z.string().trim().optional(),
  idiomaHogar: z.string().trim().optional(),
  tipoSangre: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  municipio: z.string().trim().min(2, "Escribe el municipio."),
  departamento: z.string().trim().min(2, "Escribe el departamento."),
  zonaResidencia: z.string().trim().optional(),
  encargadoNombre: z.string().trim().min(3, "Escribe el nombre del encargado."),
  encargadoParentesco: z.string().trim().min(3, "Indica el parentesco."),
  encargadoTelefono: z.string().trim().min(8, "Escribe un teléfono."),
  encargadoEmail: z
    .union([z.email("Correo inválido."), z.literal("")])
    .optional(),
  programaId: z.string().min(1, "Selecciona un programa."),
  estado: z.enum(["ACTIVO", "INACTIVO", "EGRESADO"]),
  estadoExpediente: z.enum(["COMPLETO", "EN_REVISION", "INCOMPLETO"]),
  publicadoEnGaleria: z.string().optional(),
  resumenPublico: z.string().trim().optional(),
});

export async function guardarDatosGenerales(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  // La autorización se comprueba en el servidor, antes de tocar la base.
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaDatosGenerales.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.update({
    where: { id: v.id },
    data: {
      nombres: v.nombres,
      apellidos: v.apellidos,
      fechaNacimiento: fechaDesdeInput(v.fechaNacimiento),
      sexo: v.sexo,
      cui: v.cui || null,
      lugarNacimiento: v.lugarNacimiento || null,
      idiomaHogar: v.idiomaHogar || null,
      tipoSangre: v.tipoSangre || null,
      direccion: v.direccion || null,
      municipio: v.municipio,
      departamento: v.departamento,
      zonaResidencia: v.zonaResidencia || null,
      encargadoNombre: v.encargadoNombre,
      encargadoParentesco: v.encargadoParentesco,
      encargadoTelefono: v.encargadoTelefono,
      encargadoEmail: v.encargadoEmail || null,
      programaId: v.programaId,
      estado: v.estado,
      estadoExpediente: v.estadoExpediente,
      publicadoEnGaleria: v.publicadoEnGaleria === "on",
      resumenPublico: v.resumenPublico || null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Datos generales actualizados en el expediente ${beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  revalidatePath("/admin/beneficiarios");
  return { ok: "Cambios guardados." };
}

const esquemaAvance = z.object({
  beneficiarioId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  area: z.string().trim().min(3, "Indica el área."),
  titulo: z.string().trim().min(5, "Escribe un título."),
  descripcion: z.string().trim().min(10, "Describe el avance."),
  visibleParaPadrino: z.string().optional(),
});

export async function registrarAvance(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const parseo = esquemaAvance.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const visible = v.visibleParaPadrino === "on";

  const avance = await prisma.seguimiento.create({
    data: {
      beneficiarioId: v.beneficiarioId,
      fecha: fechaDesdeInput(v.fecha),
      area: v.area,
      titulo: v.titulo,
      descripcion: v.descripcion,
      visibleParaPadrino: visible,
      registradoPor: usuario.nombre,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Seguimiento",
    entidadId: v.beneficiarioId,
    detalle: `Avance «${avance.titulo}» (${visible ? "visible para el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${v.beneficiarioId}`);
  redirect(`/admin/beneficiarios/${v.beneficiarioId}#avances`);
}
