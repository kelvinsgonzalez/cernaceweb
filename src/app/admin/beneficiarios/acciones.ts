"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  registrarAuditoria,
  requireAlgunPermiso,
  requirePermiso,
} from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { aEntero } from "@/lib/utils";
import {
  borrarDocumento,
  borrarImagenAvance,
  borrarFotoBeneficiario,
  borrarFotoExpediente,
  guardarDocumento,
  validarDocumento,
  guardarFotoBeneficiario,
  guardarFotoExpediente,
  guardarImagenAvance,
  validarImagen,
  MAXIMO_FOTOS,
  MAXIMO_FOTOS_EXPEDIENTE,
  type ArchivoGuardado,
} from "@/lib/almacenamiento";

const opcional = z.string().trim().optional();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.");

/**
 * Datos generales del expediente: todo lo que se guarda del beneficiario y de
 * su encargado. Es el mismo esquema para abrir un expediente y para
 * corregirlo, porque los campos son los mismos; lo único que cambia es el `id`,
 * que al crear todavía no existe.
 *
 * Están aquí todos los campos que la papeleta de inscripción llena, incluidos
 * los del encargado que antes solo se tecleaban al inscribir: si un dato se
 * puede escribir, se tiene que poder corregir.
 */
const esquemaDatosGenerales = z.object({
  id: z.string().min(1),
  codigoExpediente: z
    .string()
    .trim()
    .min(4, "Escribe el código del expediente.")
    .max(30, "El código es demasiado largo."),
  nombres: z.string().trim().min(2, "Escribe los nombres."),
  apellidos: z.string().trim().min(2, "Escribe los apellidos."),
  fechaNacimiento: fecha,
  sexo: z.enum(["MASCULINO", "FEMENINO"]),
  cui: opcional,
  lugarNacimiento: opcional,
  idiomaHogar: opcional,
  tipoSangre: opcional,
  direccion: opcional,
  municipio: z.string().trim().min(2, "Escribe el municipio."),
  departamento: z.string().trim().min(2, "Escribe el departamento."),
  zonaResidencia: opcional,
  sector: opcional,
  escolaridad: opcional,
  telefono: opcional,
  encargadoNombre: z.string().trim().min(3, "Escribe el nombre del encargado."),
  encargadoParentesco: z.string().trim().min(3, "Indica el parentesco."),
  encargadoTelefono: z.string().trim().min(8, "Escribe un teléfono."),
  encargadoEmail: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.email().safeParse(v).success,
      "Correo inválido.",
    )
    .optional(),
  encargadoSexo: z.enum(["MASCULINO", "FEMENINO", ""]).optional(),
  encargadoEdad: opcional,
  encargadoIdentificacion: opcional,
  encargadoEstadoCivil: opcional,
  encargadoSituacionLaboral: z.enum(["EMPLEADO", "DESEMPLEADO", ""]).optional(),
  encargadoEscolaridad: opcional,
  encargadoOficio: opcional,
  encargadoIntegrantes: opcional,
  encargadoDireccion: opcional,
  fechaIngreso: fecha,
  centroAtencion: z
    .string()
    .trim()
    .min(2, "Indica el centro donde recibe la terapia.")
    .max(60, "El nombre del centro es demasiado largo."),
  solicitaPatrocinio: z.string().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO", "EGRESADO"]),
  estadoExpediente: z.enum(["COMPLETO", "EN_REVISION", "INCOMPLETO"]),
});

/** Los campos del encargado tal como los guarda la base, desde el formulario. */
function datosDelEncargado(v: z.infer<typeof esquemaDatosGenerales>) {
  return {
    nombre: v.encargadoNombre,
    parentesco: v.encargadoParentesco,
    telefono: v.encargadoTelefono,
    email: v.encargadoEmail || null,
    sexo: v.encargadoSexo || null,
    edad: aEntero(v.encargadoEdad),
    noIdentificacion: v.encargadoIdentificacion || null,
    estadoCivil: v.encargadoEstadoCivil || null,
    situacionLaboral: v.encargadoSituacionLaboral || null,
    escolaridad: v.encargadoEscolaridad || null,
    oficio: v.encargadoOficio || null,
    integrantesFamilia: aEntero(v.encargadoIntegrantes),
    direccion: v.encargadoDireccion || null,
  };
}

/** Los campos del beneficiario, iguales al crear y al corregir. */
function datosDelBeneficiario(v: z.infer<typeof esquemaDatosGenerales>) {
  return {
    codigoExpediente: v.codigoExpediente,
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
    sector: v.sector || null,
    escolaridad: v.escolaridad || null,
    telefono: v.telefono || null,
    fechaIngreso: fechaDesdeInput(v.fechaIngreso),
    centroAtencion: v.centroAtencion,
    solicitaPatrocinio: v.solicitaPatrocinio === "on",
    estado: v.estado,
    estadoExpediente: v.estadoExpediente,
  };
}

/**
 * El código y el CUI son únicos en la base. Se comprueban antes de escribir
 * para devolver el problema en su campo en vez de un error de restricción;
 * `exceptoId` deja fuera al propio expediente cuando se está corrigiendo.
 */
async function chocaConOtroExpediente(
  v: z.infer<typeof esquemaDatosGenerales>,
  exceptoId?: string,
): Promise<Record<string, string> | null> {
  const porCodigo = await prisma.beneficiario.findUnique({
    where: { codigoExpediente: v.codigoExpediente },
    select: { id: true },
  });
  if (porCodigo && porCodigo.id !== exceptoId) {
    return { codigoExpediente: "Ya hay un expediente con ese código." };
  }

  if (v.cui) {
    const porCui = await prisma.beneficiario.findUnique({
      where: { cui: v.cui },
      select: { id: true, codigoExpediente: true },
    });
    if (porCui && porCui.id !== exceptoId) {
      return {
        cui: `Ese CUI ya está en el expediente ${porCui.codigoExpediente}.`,
      };
    }
  }

  return null;
}

/**
 * Alta manual de un expediente. La vía normal es aceptar una solicitud del
 * sitio público, pero los expedientes de papel y los ingresos que llegan
 * presencialmente no pasan por ahí: esto los abre sin inventar una solicitud
 * que nadie envió.
 *
 * Escribe beneficiario y encargado en una transacción, igual que la papeleta:
 * un encargado suelto sin expediente no le sirve a nadie. La ficha del ciclo se
 * llena después, desde el expediente.
 */
const esquemaNuevo = esquemaDatosGenerales.omit({ id: true });

export async function crearBeneficiario(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaNuevo.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = { ...parseo.data, id: "" };

  const choque = await chocaConOtroExpediente(v);
  if (choque) {
    return { error: "Revisa los campos marcados.", errores: choque };
  }

  const beneficiario = await prisma.$transaction(async (tx) => {
    const encargado = await tx.encargado.create({
      data: datosDelEncargado(v),
    });
    return tx.beneficiario.create({
      data: { ...datosDelBeneficiario(v), encargadoId: encargado.id },
    });
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Expediente ${beneficiario.codigoExpediente} abierto a mano para ${beneficiario.nombres} ${beneficiario.apellidos}`,
  });

  revalidatePath("/admin/beneficiarios");
  redirect(`/admin/beneficiarios/${beneficiario.id}`);
}

export async function guardarDatosGenerales(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaDatosGenerales.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;

  const choque = await chocaConOtroExpediente(v, v.id);
  if (choque) {
    return { error: "Revisa los campos marcados.", errores: choque };
  }

  // El encargado vive en su propia tabla: se actualiza la ficha existente o se
  // crea una. Si dos hermanos comparten encargado, el cambio les alcanza a los
  // dos, que es justamente para lo que la tabla está separada.
  const actual = await prisma.beneficiario.findUnique({
    where: { id: v.id },
    select: { encargadoId: true },
  });
  if (!actual) return { error: "Ese beneficiario ya no existe." };

  const datosEncargado = datosDelEncargado(v);
  const encargadoId = actual.encargadoId
    ? (
        await prisma.encargado.update({
          where: { id: actual.encargadoId },
          data: datosEncargado,
        })
      ).id
    : (await prisma.encargado.create({ data: datosEncargado })).id;

  const beneficiario = await prisma.beneficiario.update({
    where: { id: v.id },
    data: { ...datosDelBeneficiario(v), encargadoId },
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
  revalidatePath("/apadrina");
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

/**
 * Reseña de avance. Dos condiciones antes de escribir nada:
 *  1. El beneficiario tiene un plan de terapia aprobado y activo.
 *  2. Quien registra es responsable suyo, salvo que gestione la terapia.
 *
 * Las fotos se guardan en disco solo después de validarlas todas: así un
 * archivo rechazado no deja a medias los anteriores.
 */
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

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: {
      id: true,
      plan: { select: { activo: true } },
      responsables: {
        where: { activo: true, terapeutaId: usuario.id },
        select: { id: true },
      },
    },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  if (!beneficiario.plan?.activo) {
    return {
      error:
        "Este beneficiario todavía no tiene un plan de terapia aprobado y activo. La aprobación la da un administrador.",
    };
  }

  const gestiona = usuario.permisos.includes(PERMISOS.TERAPIA_GESTIONAR);
  if (!gestiona && beneficiario.responsables.length === 0) {
    return {
      error:
        "No estás asignado como responsable de este beneficiario, así que no puedes registrarle avances.",
    };
  }

  const entrantes = datos
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (entrantes.length > MAXIMO_FOTOS) {
    return {
      error: "Revisa los campos marcados.",
      errores: { fotos: `No puedes adjuntar más de ${MAXIMO_FOTOS} fotos.` },
    };
  }
  for (const archivo of entrantes) {
    const problema = validarImagen(archivo);
    if (problema) {
      return { error: "Revisa los campos marcados.", errores: { fotos: problema } };
    }
  }

  const guardadas: ArchivoGuardado[] = [];
  for (const archivo of entrantes) {
    guardadas.push(await guardarImagenAvance(archivo));
  }

  const avance = await prisma.seguimiento.create({
    data: {
      beneficiarioId: v.beneficiarioId,
      fecha: fechaDesdeInput(v.fecha),
      area: v.area,
      titulo: v.titulo,
      descripcion: v.descripcion,
      visibleParaPadrino: visible,
      registradoPor: usuario.nombre,
      registradoPorId: usuario.id,
      fotos: { create: guardadas },
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Seguimiento",
    entidadId: v.beneficiarioId,
    detalle: `Avance «${avance.titulo}» con ${guardadas.length} ${guardadas.length === 1 ? "foto" : "fotos"} (${visible ? "visible para el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${v.beneficiarioId}`);
  redirect(`/admin/beneficiarios/${v.beneficiarioId}#avances`);
}

/* -------------------------------------------------------------------------
   Expediente clínico
   ------------------------------------------------------------------------- */

/** Lista escrita a mano, separada por comas: se limpia y se guarda como array. */
function aLista(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

const esquemaClinico = z.object({
  beneficiarioId: z.string().min(1),
  diagnosticoPrincipal: z
    .string()
    .trim()
    .min(3, "Escribe el diagnóstico principal."),
  codigoCie10: opcional,
  fechaDiagnostico: z.union([fecha, z.literal("")]).optional(),
  tipoDiscapacidad: z.string().trim().min(3, "Indica el tipo de discapacidad."),
  gradoDependencia: z.string().trim().min(3, "Indica el grado de dependencia."),
  medicoTratante: opcional,
  alergias: opcional,
  medicamentos: opcional,
  antecedentes: opcional,
});

/**
 * Expediente clínico. Es uno por beneficiario, así que la misma acción lo crea
 * la primera vez y lo corrige después: quien llena la ficha no tiene por qué
 * saber si ya existía.
 *
 * Pide expediente.clinico.escribir, no expediente.escribir: el área médica se
 * escribe con el mismo permiso con el que se lee.
 */
export async function guardarExpedienteClinico(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR);

  const parseo = esquemaClinico.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const campos = {
    diagnosticoPrincipal: v.diagnosticoPrincipal,
    codigoCie10: v.codigoCie10 || null,
    fechaDiagnostico: v.fechaDiagnostico
      ? fechaDesdeInput(v.fechaDiagnostico)
      : null,
    tipoDiscapacidad: v.tipoDiscapacidad,
    gradoDependencia: v.gradoDependencia,
    medicoTratante: v.medicoTratante || null,
    alergias: v.alergias || null,
    medicamentos: v.medicamentos || null,
    antecedentes: v.antecedentes || null,
  };

  const existia = await prisma.expedienteClinico.count({
    where: { beneficiarioId: beneficiario.id },
  });

  await prisma.expedienteClinico.upsert({
    where: { beneficiarioId: beneficiario.id },
    create: { beneficiarioId: beneficiario.id, ...campos },
    update: campos,
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: existia > 0 ? "ACTUALIZAR" : "CREAR",
    entidad: "ExpedienteClinico",
    entidadId: beneficiario.id,
    detalle: `Expediente clínico ${existia > 0 ? "actualizado" : "registrado"} en ${beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  return { ok: "Expediente clínico guardado." };
}

/**
 * Terapias que recibe el beneficiario. Son texto libre a propósito: el
 * programa de la landing es un referente para quien visita el sitio, y lo que
 * cada niño recibe se anota aquí con sus propias palabras, tantas como haga
 * falta y con una explicación más larga si el caso lo pide.
 *
 * Las lleva quien edita el expediente o quien escribe el área clínica: el
 * terapeuta que atiende al niño es quien mejor sabe qué terapia recibe.
 */
const PERMISOS_TERAPIAS = [
  PERMISOS.EXPEDIENTE_ESCRIBIR,
  PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
];

const esquemaTerapia = z.object({
  beneficiarioId: z.string().min(1),
  nombre: z
    .string()
    .trim()
    .min(3, "Escribe el nombre de la terapia.")
    .max(80, "El nombre es demasiado largo."),
  detalle: z
    .string()
    .trim()
    .max(2000, "La explicación no puede pasar de 2000 caracteres.")
    .optional(),
});

export async function agregarTerapia(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requireAlgunPermiso(PERMISOS_TERAPIAS);

  const parseo = esquemaTerapia.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: {
      id: true,
      codigoExpediente: true,
      terapias: { select: { nombre: true, orden: true } },
    },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const repetida = beneficiario.terapias.some(
    (t) => t.nombre.toLowerCase() === v.nombre.toLowerCase(),
  );
  if (repetida) {
    return {
      error: "Revisa los campos marcados.",
      errores: { nombre: "Ese niño ya tiene una terapia con ese nombre." },
    };
  }

  const orden =
    beneficiario.terapias.reduce((max, t) => Math.max(max, t.orden), -1) + 1;

  await prisma.terapiaBeneficiario.create({
    data: {
      beneficiarioId: beneficiario.id,
      nombre: v.nombre,
      detalle: v.detalle || null,
      orden,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "TerapiaBeneficiario",
    entidadId: beneficiario.id,
    detalle: `Terapia «${v.nombre}» añadida al expediente ${beneficiario.codigoExpediente}`,
  });

  refrescarTerapias(beneficiario.id);
  return { ok: `Terapia «${v.nombre}» añadida.` };
}

const esquemaTerapiaEditada = esquemaTerapia.extend({
  terapiaId: z.string().min(1),
});

export async function actualizarTerapia(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requireAlgunPermiso(PERMISOS_TERAPIAS);

  const parseo = esquemaTerapiaEditada.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const terapia = await prisma.terapiaBeneficiario.findUnique({
    where: { id: v.terapiaId },
    select: {
      id: true,
      nombre: true,
      beneficiarioId: true,
      beneficiario: {
        select: {
          codigoExpediente: true,
          terapias: { select: { id: true, nombre: true } },
        },
      },
    },
  });
  if (!terapia || terapia.beneficiarioId !== v.beneficiarioId) {
    return { error: "Esa terapia ya no existe." };
  }

  const repetida = terapia.beneficiario.terapias.some(
    (t) => t.id !== terapia.id && t.nombre.toLowerCase() === v.nombre.toLowerCase(),
  );
  if (repetida) {
    return {
      error: "Revisa los campos marcados.",
      errores: { nombre: "Ese niño ya tiene otra terapia con ese nombre." },
    };
  }

  await prisma.terapiaBeneficiario.update({
    where: { id: terapia.id },
    data: { nombre: v.nombre, detalle: v.detalle || null },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "TerapiaBeneficiario",
    entidadId: terapia.beneficiarioId,
    detalle:
      terapia.nombre === v.nombre
        ? `Terapia «${v.nombre}» corregida en el expediente ${terapia.beneficiario.codigoExpediente}`
        : `Terapia «${terapia.nombre}» pasa a llamarse «${v.nombre}» en el expediente ${terapia.beneficiario.codigoExpediente}`,
  });

  refrescarTerapias(terapia.beneficiarioId);
  return { ok: "Terapia guardada." };
}

export async function eliminarTerapia(datos: FormData): Promise<void> {
  const usuario = await requireAlgunPermiso(PERMISOS_TERAPIAS);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const terapia = await prisma.terapiaBeneficiario.findUnique({
    where: { id },
    select: {
      nombre: true,
      beneficiarioId: true,
      beneficiario: { select: { codigoExpediente: true } },
    },
  });
  if (!terapia) return;

  await prisma.terapiaBeneficiario.delete({ where: { id } });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "TerapiaBeneficiario",
    entidadId: terapia.beneficiarioId,
    detalle: `Terapia «${terapia.nombre}» retirada del expediente ${terapia.beneficiario.codigoExpediente}`,
  });

  refrescarTerapias(terapia.beneficiarioId);
}

/** Las terapias se ven en el expediente, en el sitio público y en los portales. */
function refrescarTerapias(beneficiarioId: string) {
  revalidatePath(`/admin/beneficiarios/${beneficiarioId}`);
  revalidatePath("/apadrina");
  revalidatePath(`/apadrina/${beneficiarioId}`);
  revalidatePath("/");
}

const esquemaEvaluacion = z.object({
  beneficiarioId: z.string().min(1),
  fecha,
  tipo: z.string().trim().min(3, "Indica el tipo de evaluación."),
  profesional: z.string().trim().min(3, "Escribe quién la realizó."),
  resultado: z.string().trim().min(5, "Resume el resultado."),
  documento: opcional,
});

export async function registrarEvaluacionClinica(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR);

  const parseo = esquemaEvaluacion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const evaluacion = await prisma.evaluacionClinica.create({
    data: {
      beneficiarioId: beneficiario.id,
      fecha: fechaDesdeInput(v.fecha),
      tipo: v.tipo,
      profesional: v.profesional,
      resultado: v.resultado,
      documento: v.documento || null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "EvaluacionClinica",
    entidadId: beneficiario.id,
    detalle: `Evaluación «${evaluacion.tipo}» registrada en ${beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  return { ok: "Evaluación registrada." };
}

export async function eliminarEvaluacionClinica(datos: FormData): Promise<void> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const evaluacion = await prisma.evaluacionClinica.findUnique({
    where: { id },
    select: {
      tipo: true,
      beneficiarioId: true,
      beneficiario: { select: { codigoExpediente: true } },
    },
  });
  if (!evaluacion) return;

  await prisma.evaluacionClinica.delete({ where: { id } });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "EvaluacionClinica",
    entidadId: evaluacion.beneficiarioId,
    detalle: `Evaluación «${evaluacion.tipo}» eliminada de ${evaluacion.beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${evaluacion.beneficiarioId}`);
}

/* -------------------------------------------------------------------------
   Ficha socioeconómica
   ------------------------------------------------------------------------- */

const esquemaSocio = z.object({
  beneficiarioId: z.string().min(1),
  integrantesHogar: z
    .string()
    .trim()
    .regex(/^\d+$/, "Escribe cuántas personas viven en el hogar."),
  ingresoMensual: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Escribe el ingreso en quetzales."),
  fuenteIngreso: z.string().trim().min(3, "Indica de dónde viene el ingreso."),
  tipoVivienda: z.string().trim().min(3, "Indica el tipo de vivienda."),
  materialConstruccion: z
    .string()
    .trim()
    .min(3, "Indica el material de construcción."),
  escolaridadEncargado: z
    .string()
    .trim()
    .min(3, "Indica la escolaridad del encargado."),
  serviciosBasicos: opcional,
  observaciones: opcional,
  nivelVulnerabilidad: z.enum(["ALTO", "MEDIO", "BAJO"], {
    message: "Indica el nivel de vulnerabilidad.",
  }),
  elegibleBeca: z.string().optional(),
  fechaEstudio: fecha,
  realizadoPor: z.string().trim().min(3, "Escribe quién hizo el estudio."),
});

/**
 * Estudio socioeconómico del hogar. Como el clínico, es uno por beneficiario y
 * la misma acción lo abre y lo corrige. Se rehace cada vez que trabajo social
 * vuelve a visitar: la fecha del estudio dice de cuándo es la foto.
 */
export async function guardarFichaSocioeconomica(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(
    PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
  );

  const parseo = esquemaSocio.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const campos = {
    integrantesHogar: Number(v.integrantesHogar),
    ingresoMensual: v.ingresoMensual,
    fuenteIngreso: v.fuenteIngreso,
    tipoVivienda: v.tipoVivienda,
    materialConstruccion: v.materialConstruccion,
    escolaridadEncargado: v.escolaridadEncargado,
    serviciosBasicos: aLista(v.serviciosBasicos),
    observaciones: v.observaciones || null,
    nivelVulnerabilidad: v.nivelVulnerabilidad,
    elegibleBeca: v.elegibleBeca === "on",
    fechaEstudio: fechaDesdeInput(v.fechaEstudio),
    realizadoPor: v.realizadoPor,
  };

  const existia = await prisma.fichaSocioeconomica.count({
    where: { beneficiarioId: beneficiario.id },
  });

  await prisma.fichaSocioeconomica.upsert({
    where: { beneficiarioId: beneficiario.id },
    create: { beneficiarioId: beneficiario.id, ...campos },
    update: campos,
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: existia > 0 ? "ACTUALIZAR" : "CREAR",
    entidad: "FichaSocioeconomica",
    entidadId: beneficiario.id,
    detalle: `Ficha socioeconómica ${existia > 0 ? "actualizada" : "registrada"} en ${beneficiario.codigoExpediente} (vulnerabilidad ${campos.nivelVulnerabilidad.toLowerCase()})`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  return { ok: "Ficha socioeconómica guardada." };
}

/* -------------------------------------------------------------------------
   Fotografías del expediente
   ------------------------------------------------------------------------- */

/**
 * Foto principal del beneficiario. Es una sola y hace dos trabajos: identifica
 * el expediente para el equipo y es la que se ve en el sitio público cuando la
 * familia pide patrocinador y la administración lo autoriza. Por eso el archivo
 * no vive en public/ y se sirve por /api/fotos/beneficiario/[id], que comprueba
 * esas dos condiciones en cada petición.
 *
 * Subirla es parte de llevar el expediente, así que basta expediente.escribir.
 * Publicarla sigue siendo otra decisión y otro permiso.
 */
export async function guardarFotoPrincipal(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const id = String(datos.get("id") ?? "");
  if (!id) return { error: "Falta el expediente." };

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: { id: true, codigoExpediente: true, fotoArchivo: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const entrante = datos.get("foto");
  const nueva = entrante instanceof File && entrante.size > 0 ? entrante : null;
  const quitar = datos.get("quitarFoto") === "on" && !nueva;

  if (!nueva && !quitar) {
    return {
      error: "Revisa los campos marcados.",
      errores: { foto: "Elige la fotografía que quieres guardar." },
    };
  }

  if (nueva) {
    const problema = validarImagen(nueva);
    if (problema) {
      return { error: "Revisa los campos marcados.", errores: { foto: problema } };
    }
  }

  const anterior = beneficiario.fotoArchivo;
  const guardada = nueva ? await guardarFotoBeneficiario(nueva) : null;

  await prisma.beneficiario.update({
    where: { id: beneficiario.id },
    data: { fotoArchivo: guardada ? guardada.archivo : null },
  });

  // El archivo viejo se borra después de que la base apunte al nuevo: si algo
  // falla antes, queda un archivo de más y no una foto rota.
  if (anterior) await borrarFotoBeneficiario(anterior);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Foto principal del expediente ${beneficiario.codigoExpediente}: ${guardada ? "actualizada" : "retirada"}`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  revalidatePath("/admin/beneficiarios");
  revalidatePath("/apadrina");
  return {
    ok: guardada ? "Foto principal actualizada." : "Foto principal retirada.",
  };
}

const esquemaFotosExpediente = z.object({
  beneficiarioId: z.string().min(1),
  descripcion: z.string().trim().optional(),
  visibleParaPadrino: z.string().optional(),
});

/**
 * Fotos de evidencia: el registro visual del caso —la condición al ingresar,
 * una visita domiciliar, una ayuda entregada—. No son las de un avance, que
 * ilustran una reseña concreta y cuelgan de ella.
 *
 * Se guardan en disco solo después de validarlas todas, para que un archivo
 * rechazado no deje a medias los anteriores.
 */
export async function subirFotosExpediente(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaFotosExpediente.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const entrantes = datos
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (entrantes.length === 0) {
    return {
      error: "Revisa los campos marcados.",
      errores: { fotos: "Elige al menos una fotografía." },
    };
  }
  if (entrantes.length > MAXIMO_FOTOS_EXPEDIENTE) {
    return {
      error: "Revisa los campos marcados.",
      errores: {
        fotos: `No puedes subir más de ${MAXIMO_FOTOS_EXPEDIENTE} fotos de una vez.`,
      },
    };
  }
  for (const archivo of entrantes) {
    const problema = validarImagen(archivo);
    if (problema) {
      return { error: "Revisa los campos marcados.", errores: { fotos: problema } };
    }
  }

  const compartidas = v.visibleParaPadrino === "on";
  const guardadas: ArchivoGuardado[] = [];
  for (const archivo of entrantes) {
    guardadas.push(await guardarFotoExpediente(archivo));
  }

  await prisma.fotoExpediente.createMany({
    data: guardadas.map((g) => ({
      beneficiarioId: beneficiario.id,
      archivo: g.archivo,
      tipoMime: g.tipoMime,
      tamanoBytes: g.tamanoBytes,
      descripcion: v.descripcion || null,
      visibleParaPadrino: compartidas,
      subidaPor: usuario.nombre,
      subidaPorId: usuario.id,
    })),
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "FotoExpediente",
    entidadId: beneficiario.id,
    detalle: `${guardadas.length} ${guardadas.length === 1 ? "foto de evidencia adjuntada" : "fotos de evidencia adjuntadas"} al expediente ${beneficiario.codigoExpediente} (${compartidas ? "compartidas con el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  return {
    ok: `${guardadas.length} ${guardadas.length === 1 ? "foto adjuntada" : "fotos adjuntadas"}.`,
  };
}

/** Borra una foto de evidencia: primero la fila, después el archivo. */
export async function eliminarFotoExpediente(datos: FormData): Promise<void> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const foto = await prisma.fotoExpediente.findUnique({
    where: { id },
    select: {
      archivo: true,
      beneficiarioId: true,
      beneficiario: { select: { codigoExpediente: true } },
    },
  });
  if (!foto) return;

  await prisma.fotoExpediente.delete({ where: { id } });
  await borrarFotoExpediente(foto.archivo);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "FotoExpediente",
    entidadId: foto.beneficiarioId,
    detalle: `Foto de evidencia eliminada del expediente ${foto.beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${foto.beneficiarioId}`);
}

const esquemaPublicacion = z.object({
  id: z.string().min(1),
  resumenPublico: z.string().trim().optional(),
  publicadoEnGaleria: z.string().optional(),
  quitarFoto: z.string().optional(),
});

/**
 * Autorización para que un beneficiario salga en el sitio público.
 *
 * Son dos cosas distintas y a propósito: `solicitaPatrocinio` lo pide la
 * familia en la ficha de inscripción, y esto es el permiso que da la
 * administración. Hacen falta las dos para aparecer, y ninguna de las dos toca
 * la terapia: el equipo sigue atendiendo al niño mientras se le busca
 * patrocinador, o aunque nunca se le busque.
 */
export async function guardarPublicacion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.GALERIA_PUBLICAR);

  const parseo = esquemaPublicacion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.id },
    select: {
      id: true,
      nombres: true,
      codigoExpediente: true,
      fotoArchivo: true,
      solicitaPatrocinio: true,
    },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const publicar = v.publicadoEnGaleria === "on";

  if (publicar && !beneficiario.solicitaPatrocinio) {
    return {
      error:
        "La familia no ha pedido patrocinador para este niño. La petición se registra en la ficha de inscripción, y sin ella no se puede publicar.",
    };
  }

  const entrante = datos.get("foto");
  const nueva = entrante instanceof File && entrante.size > 0 ? entrante : null;
  if (nueva) {
    const problema = validarImagen(nueva);
    if (problema) {
      return { error: "Revisa los campos marcados.", errores: { foto: problema } };
    }
  }

  const quitar = v.quitarFoto === "on" && !nueva;
  const anterior = beneficiario.fotoArchivo;
  const guardada = nueva ? await guardarFotoBeneficiario(nueva) : null;

  await prisma.beneficiario.update({
    where: { id: beneficiario.id },
    data: {
      resumenPublico: v.resumenPublico || null,
      publicadoEnGaleria: publicar,
      ...(guardada ? { fotoArchivo: guardada.archivo } : {}),
      ...(quitar ? { fotoArchivo: null } : {}),
    },
  });

  // El archivo viejo se borra después de que la base apunte al nuevo: si algo
  // falla antes, queda un archivo de más y no una foto rota.
  if (anterior && (guardada || quitar)) {
    await borrarFotoBeneficiario(anterior);
  }

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Publicación en el sitio público de ${beneficiario.codigoExpediente}: ${publicar ? "autorizada" : "retirada"}${guardada ? ", foto actualizada" : quitar ? ", foto retirada" : ""}`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  revalidatePath("/admin/asignaciones");
  revalidatePath("/apadrina");
  revalidatePath("/");

  return {
    ok: publicar
      ? "Autorizado. Ya aparece en la página pública mientras no tenga padrino."
      : "Autorización retirada. Deja de aparecer en la página pública y su foto deja de ser accesible.",
  };
}

const esquemaComentario = z.object({
  seguimientoId: z.string().min(1),
  texto: z.string().trim().min(3, "Escribe el comentario."),
});

/**
 * Comentario del equipo sobre un avance. Es interno: no se comparte con el
 * padrino ni aparece en su portal.
 *
 * Basta `seguimiento.escribir` sin ser responsable del niño, a diferencia de
 * los avances: la gracia es justamente que un compañero pueda opinar sobre un
 * caso que no lleva. El avance sigue siendo del responsable; esto es la
 * conversación alrededor.
 */
export async function comentarAvance(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const parseo = esquemaComentario.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const avance = await prisma.seguimiento.findUnique({
    where: { id: v.seguimientoId },
    select: { id: true, titulo: true, beneficiarioId: true },
  });
  if (!avance) return { error: "Ese avance ya no existe." };

  await prisma.comentarioAvance.create({
    data: {
      seguimientoId: avance.id,
      texto: v.texto,
      autor: usuario.nombre,
      autorId: usuario.id,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "ComentarioAvance",
    entidadId: avance.beneficiarioId,
    detalle: `Comentario en el avance «${avance.titulo}»`,
  });

  revalidatePath(`/admin/beneficiarios/${avance.beneficiarioId}`);
  return { ok: "Comentario publicado." };
}

const esquemaDocumento = z.object({
  beneficiarioId: z.string().min(1),
  nombre: z.string().trim().min(3, "Ponle un nombre al documento."),
  categoria: z.string().trim().min(3, "Indica la categoría."),
  fechaVencimiento: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional(),
  visibleParaPadrino: z.string().optional(),
});

export async function subirDocumento(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.DOCUMENTOS_SUBIR);

  const parseo = esquemaDocumento.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const entrante = datos.get("archivo");
  if (!(entrante instanceof File) || entrante.size === 0) {
    return {
      error: "Revisa los campos marcados.",
      errores: { archivo: "Elige el archivo que quieres adjuntar." },
    };
  }
  const problema = validarDocumento(entrante);
  if (problema) {
    return { error: "Revisa los campos marcados.", errores: { archivo: problema } };
  }

  const guardado = await guardarDocumento(entrante);
  const compartido = v.visibleParaPadrino === "on";

  await prisma.documento.create({
    data: {
      beneficiarioId: beneficiario.id,
      nombre: v.nombre,
      categoria: v.categoria,
      tipoMime: guardado.tipoMime,
      tamanoBytes: guardado.tamanoBytes,
      archivo: guardado.archivo,
      visibleParaPadrino: compartido,
      fechaVencimiento: v.fechaVencimiento
        ? fechaDesdeInput(v.fechaVencimiento)
        : null,
      subidoPor: usuario.nombre,
      subidoPorId: usuario.id,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Documento",
    entidadId: beneficiario.id,
    detalle: `Documento «${v.nombre}» adjuntado al expediente ${beneficiario.codigoExpediente} (${compartido ? "compartido con el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  return { ok: `Documento «${v.nombre}» adjuntado al expediente.` };
}

/**
 * Corregir la ficha de un documento: el nombre con el que aparece, su
 * categoría, cuándo caduca y si el padrino puede abrirlo. El archivo no se
 * toca —cambiarlo sería otro documento—; para eso se adjunta el nuevo y se
 * borra este.
 */
const esquemaDocumentoEditado = esquemaDocumento.extend({
  documentoId: z.string().min(1),
});

export async function actualizarDocumento(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.DOCUMENTOS_SUBIR);

  const parseo = esquemaDocumentoEditado.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const documento = await prisma.documento.findUnique({
    where: { id: v.documentoId },
    select: {
      id: true,
      beneficiarioId: true,
      beneficiario: { select: { codigoExpediente: true } },
    },
  });
  // Un documento de otro expediente no se corrige desde aquí, aunque el id
  // exista y quien lo pide tenga el permiso.
  if (!documento || documento.beneficiarioId !== v.beneficiarioId) {
    return { error: "Ese documento ya no existe." };
  }

  const compartido = v.visibleParaPadrino === "on";

  await prisma.documento.update({
    where: { id: documento.id },
    data: {
      nombre: v.nombre,
      categoria: v.categoria,
      visibleParaPadrino: compartido,
      fechaVencimiento: v.fechaVencimiento
        ? fechaDesdeInput(v.fechaVencimiento)
        : null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Documento",
    entidadId: documento.beneficiarioId,
    detalle: `Documento «${v.nombre}» corregido en ${documento.beneficiario.codigoExpediente} (${compartido ? "compartido con el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${documento.beneficiarioId}`);
  return { ok: "Documento actualizado." };
}

/** Borra el documento del expediente: primero la fila, después el archivo. */
export async function eliminarDocumento(datos: FormData): Promise<void> {
  const usuario = await requirePermiso(PERMISOS.DOCUMENTOS_SUBIR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const documento = await prisma.documento.findUnique({
    where: { id },
    select: {
      nombre: true,
      archivo: true,
      beneficiarioId: true,
      beneficiario: { select: { codigoExpediente: true } },
    },
  });
  if (!documento) return;

  await prisma.documento.delete({ where: { id } });
  if (documento.archivo) await borrarDocumento(documento.archivo);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "Documento",
    entidadId: documento.beneficiarioId,
    detalle: `Documento «${documento.nombre}» eliminado de ${documento.beneficiario.codigoExpediente}`,
  });

  revalidatePath(`/admin/beneficiarios/${documento.beneficiarioId}`);
}

/**
 * Corregir un avance ya registrado. Las condiciones son las mismas que para
 * escribirlo —plan activo y ser responsable del niño, salvo que se gestione la
 * terapia—, y además solo se corrige el propio: el avance lleva la firma de
 * quien lo escribió, y editar el de otro la falsearía.
 *
 * Las fotos que se adjunten se suman a las que ya tenía; las anteriores se
 * quitan una a una.
 */
const esquemaAvanceEditado = esquemaAvance.extend({
  avanceId: z.string().min(1),
});

export async function actualizarAvance(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const parseo = esquemaAvanceEditado.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const avance = await prisma.seguimiento.findUnique({
    where: { id: v.avanceId },
    select: { id: true, beneficiarioId: true, registradoPorId: true },
  });
  if (!avance || avance.beneficiarioId !== v.beneficiarioId) {
    return { error: "Ese avance ya no existe." };
  }

  const gestiona = usuario.permisos.includes(PERMISOS.TERAPIA_GESTIONAR);
  if (!gestiona && avance.registradoPorId !== usuario.id) {
    return {
      error:
        "Este avance lo escribió otra persona. Solo puedes corregir los tuyos, o pedirlo a quien gestiona la terapia.",
    };
  }

  const entrantes = datos
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const yaTiene = await prisma.fotoAvance.count({
    where: { seguimientoId: avance.id },
  });
  if (yaTiene + entrantes.length > MAXIMO_FOTOS) {
    return {
      error: "Revisa los campos marcados.",
      errores: {
        fotos: `El avance no puede pasar de ${MAXIMO_FOTOS} fotos y ya tiene ${yaTiene}.`,
      },
    };
  }
  for (const archivo of entrantes) {
    const problema = validarImagen(archivo);
    if (problema) {
      return { error: "Revisa los campos marcados.", errores: { fotos: problema } };
    }
  }

  const guardadas: ArchivoGuardado[] = [];
  for (const archivo of entrantes) {
    guardadas.push(await guardarImagenAvance(archivo));
  }

  const visible = v.visibleParaPadrino === "on";

  await prisma.seguimiento.update({
    where: { id: avance.id },
    data: {
      fecha: fechaDesdeInput(v.fecha),
      area: v.area,
      titulo: v.titulo,
      descripcion: v.descripcion,
      visibleParaPadrino: visible,
      ...(guardadas.length > 0 ? { fotos: { create: guardadas } } : {}),
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Seguimiento",
    entidadId: avance.beneficiarioId,
    detalle: `Avance «${v.titulo}» corregido${guardadas.length > 0 ? ` y ${guardadas.length} ${guardadas.length === 1 ? "foto añadida" : "fotos añadidas"}` : ""} (${visible ? "visible para el padrino" : "solo uso interno"})`,
  });

  revalidatePath(`/admin/beneficiarios/${avance.beneficiarioId}`);
  return { ok: "Avance actualizado." };
}

/** Quita una foto de un avance: primero la fila, después el archivo. */
export async function eliminarFotoAvance(datos: FormData): Promise<void> {
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const foto = await prisma.fotoAvance.findUnique({
    where: { id },
    select: {
      archivo: true,
      seguimiento: {
        select: { titulo: true, beneficiarioId: true, registradoPorId: true },
      },
    },
  });
  if (!foto) return;

  const gestiona = usuario.permisos.includes(PERMISOS.TERAPIA_GESTIONAR);
  if (!gestiona && foto.seguimiento.registradoPorId !== usuario.id) return;

  await prisma.fotoAvance.delete({ where: { id } });
  await borrarImagenAvance(foto.archivo);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ELIMINAR",
    entidad: "FotoAvance",
    entidadId: foto.seguimiento.beneficiarioId,
    detalle: `Foto quitada del avance «${foto.seguimiento.titulo}»`,
  });

  revalidatePath(`/admin/beneficiarios/${foto.seguimiento.beneficiarioId}`);
}

/* -------------------------------------------------------------------------
   Cambio rápido de estado desde la cabecera del expediente
   ------------------------------------------------------------------------- */

/**
 * Los dos estados del expediente se cambian desde la propia cabecera, sin
 * pasar por «Editar datos»: dar un expediente por completo o a un niño por
 * inactivo es una decisión de un clic, no una corrección de ficha. Cada cambio
 * queda en la bitácora con el valor anterior y el nuevo.
 */
const ETIQUETA_ESTADO_BENEFICIARIO = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  EGRESADO: "Egresado",
} as const;

const ETIQUETA_ESTADO_EXPEDIENTE = {
  COMPLETO: "Completo",
  EN_REVISION: "En revisión",
  INCOMPLETO: "Incompleto",
} as const;

const esquemaEstadoBeneficiario = z.object({
  id: z.string().min(1),
  estado: z.enum(["ACTIVO", "INACTIVO", "EGRESADO"]),
});

const esquemaEstadoExpediente = z.object({
  id: z.string().min(1),
  estadoExpediente: z.enum(["COMPLETO", "EN_REVISION", "INCOMPLETO"]),
});

function refrescarExpediente(id: string) {
  revalidatePath(`/admin/beneficiarios/${id}`);
  revalidatePath("/admin/beneficiarios");
  // La galería pública solo enseña activos.
  revalidatePath("/apadrina");
}

export async function cambiarEstadoBeneficiario(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaEstadoBeneficiario.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return;
  const { id, estado } = parseo.data;

  const actual = await prisma.beneficiario.findUnique({
    where: { id },
    select: { estado: true, codigoExpediente: true },
  });
  if (!actual || actual.estado === estado) return;

  await prisma.beneficiario.update({ where: { id }, data: { estado } });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Beneficiario",
    entidadId: id,
    detalle: `Estado del beneficiario ${actual.codigoExpediente}: de ${ETIQUETA_ESTADO_BENEFICIARIO[actual.estado]} a ${ETIQUETA_ESTADO_BENEFICIARIO[estado]}`,
  });

  refrescarExpediente(id);
}

export async function cambiarEstadoExpediente(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaEstadoExpediente.safeParse(Object.fromEntries(datos));
  if (!parseo.success) return;
  const { id, estadoExpediente } = parseo.data;

  const actual = await prisma.beneficiario.findUnique({
    where: { id },
    select: { estadoExpediente: true, codigoExpediente: true },
  });
  if (!actual || actual.estadoExpediente === estadoExpediente) return;

  await prisma.beneficiario.update({
    where: { id },
    data: { estadoExpediente },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Beneficiario",
    entidadId: id,
    detalle: `Estado del expediente ${actual.codigoExpediente}: de ${ETIQUETA_ESTADO_EXPEDIENTE[actual.estadoExpediente]} a ${ETIQUETA_ESTADO_EXPEDIENTE[estadoExpediente]}`,
  });

  refrescarExpediente(id);
}
