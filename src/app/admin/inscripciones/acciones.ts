"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { aEntero } from "@/lib/utils";
import { DEPARTAMENTOS } from "@/lib/guatemala";

/**
 * Ficha de inscripción del ciclo. Un solo formulario escribe en tres tablas
 * —beneficiario, encargado e inscripción— porque en papel es una sola hoja.
 *
 * `impresionClinica` y `otrasEnfermedades` solo se aceptan de quien tiene
 * expediente.clinico.leer, el mismo permiso con el que se muestran: quien no
 * puede consultar el área clínica tampoco escribe en ella a ciegas. El
 * formulario ni siquiera le presenta los campos.
 */

const opcional = z.string().trim().optional();
// El correo del encargado es opcional: muchas familias no tienen uno. Solo se
// revisa el formato cuando escriben algo, y un campo en blanco —o con espacios
// de sobra— pasa sin protestar.
const correoOpcional = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || z.email().safeParse(v).success,
    "Correo inválido.",
  )
  .optional();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.");

const esquema = z.object({
  beneficiarioId: z.string().min(1),

  // Beneficiario
  escolaridad: opcional,
  sector: opcional,
  telefono: opcional,
  solicitaPatrocinio: z.string().optional(),

  // Encargado
  encargadoNombre: z.string().trim().min(3, "Escribe el nombre del encargado."),
  encargadoParentesco: opcional,
  encargadoSexo: z.enum(["MASCULINO", "FEMENINO", ""]).optional(),
  encargadoEdad: opcional,
  encargadoIdentificacion: opcional,
  encargadoEstadoCivil: opcional,
  encargadoSituacionLaboral: z.enum(["EMPLEADO", "DESEMPLEADO", ""]).optional(),
  encargadoEscolaridad: opcional,
  encargadoOficio: opcional,
  encargadoIntegrantes: opcional,
  encargadoDireccion: opcional,
  encargadoTelefono: opcional,
  encargadoEmail: correoOpcional,

  // Inscripción
  ciclo: z
    .string()
    .regex(/^\d{4}$/, "El ciclo es un año de cuatro dígitos.")
    .refine(
      (v) => Number(v) >= 2000 && Number(v) <= 2100,
      "Ciclo fuera de rango.",
    ),
  fechaInscripcion: fecha,
  tipoIngreso: z.enum(["PRIMER_INGRESO", "REINGRESO"], {
    message: "Indica el tipo de ingreso.",
  }),
  fechaPrimerIngreso: z.union([fecha, z.literal("")]).optional(),
  referidoPor: opcional,
  areaServicio: opcional,
  impresionClinica: opcional,
  otrasEnfermedades: opcional,
  responsableInscripcion: z.string().trim().min(3, "Indica quién inscribe."),
  voBo: opcional,
});

export async function registrarInscripcion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquema.safeParse(Object.fromEntries(datos));
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
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      encargadoId: true,
    },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const ciclo = Number(v.ciclo);
  const puedeClinico = usuario.permisos.includes(
    PERMISOS.EXPEDIENTE_CLINICO_LEER,
  );

  // El par beneficiario-ciclo es único en la base; se comprueba antes para
  // devolver un mensaje en vez de un error de restricción.
  const repetida = await prisma.inscripcion.findUnique({
    where: { beneficiarioId_ciclo: { beneficiarioId: beneficiario.id, ciclo } },
    select: { id: true },
  });
  if (repetida) {
    return {
      error: "Revisa los campos marcados.",
      errores: { ciclo: `Ya existe una inscripción del ciclo ${ciclo}.` },
    };
  }

  const datosEncargado = {
    nombre: v.encargadoNombre,
    parentesco: v.encargadoParentesco || null,
    sexo: v.encargadoSexo || null,
    edad: aEntero(v.encargadoEdad),
    noIdentificacion: v.encargadoIdentificacion || null,
    estadoCivil: v.encargadoEstadoCivil || null,
    situacionLaboral: v.encargadoSituacionLaboral || null,
    escolaridad: v.encargadoEscolaridad || null,
    oficio: v.encargadoOficio || null,
    integrantesFamilia: aEntero(v.encargadoIntegrantes),
    direccion: v.encargadoDireccion || null,
    telefono: v.encargadoTelefono || null,
    email: v.encargadoEmail || null,
  };

  await prisma.$transaction(async (tx) => {
    const encargadoId = beneficiario.encargadoId
      ? (
          await tx.encargado.update({
            where: { id: beneficiario.encargadoId },
            data: datosEncargado,
          })
        ).id
      : (await tx.encargado.create({ data: datosEncargado })).id;

    await tx.beneficiario.update({
      where: { id: beneficiario.id },
      data: {
        escolaridad: v.escolaridad || null,
        sector: v.sector || null,
        telefono: v.telefono || null,
        // La petición de la familia. Publicarlo es otra decisión, y la toma la
        // administración desde la pantalla de publicación.
        solicitaPatrocinio: v.solicitaPatrocinio === "on",
        encargadoId,
      },
    });

    await tx.inscripcion.create({
      data: {
        beneficiarioId: beneficiario.id,
        ciclo,
        fechaInscripcion: fechaDesdeInput(v.fechaInscripcion),
        tipoIngreso: v.tipoIngreso,
        fechaPrimerIngreso: v.fechaPrimerIngreso
          ? fechaDesdeInput(v.fechaPrimerIngreso)
          : null,
        referidoPor: v.referidoPor || null,
        areaServicio: v.areaServicio || null,
        impresionClinica: puedeClinico ? v.impresionClinica || null : null,
        otrasEnfermedades: puedeClinico ? v.otrasEnfermedades || null : null,
        responsableInscripcion: v.responsableInscripcion,
        voBo: v.voBo || null,
      },
    });
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Inscripcion",
    entidadId: beneficiario.id,
    detalle: `Ficha de inscripción del ciclo ${ciclo} para el expediente ${beneficiario.codigoExpediente} (${v.tipoIngreso === "PRIMER_INGRESO" ? "primer ingreso" : "reingreso"})`,
  });

  revalidatePath("/admin/inscripciones");
  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  redirect(`/admin/beneficiarios/${beneficiario.id}#inscripciones`);
}

/**
 * Corregir una ficha de ciclo ya guardada. Es el mismo formulario y el mismo
 * esquema que al llenarla: lo que cambia es que la fila existe, así que en vez
 * de crearla se actualiza.
 *
 * Escribe también en beneficiario y encargado, igual que el alta: la ficha es
 * una hoja sola y corregir el teléfono del encargado en ella tiene que
 * corregirlo de verdad, no solo en la copia del ciclo.
 */
const esquemaActualizacion = esquema.extend({
  inscripcionId: z.string().min(1),
});

export async function actualizarInscripcion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const parseo = esquemaActualizacion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;

  const ficha = await prisma.inscripcion.findUnique({
    where: { id: v.inscripcionId },
    select: { id: true, beneficiarioId: true },
  });
  if (!ficha || ficha.beneficiarioId !== v.beneficiarioId) {
    return { error: "Esa ficha de inscripción ya no existe." };
  }

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, codigoExpediente: true, encargadoId: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };

  const ciclo = Number(v.ciclo);
  const puedeClinico = usuario.permisos.includes(
    PERMISOS.EXPEDIENTE_CLINICO_LEER,
  );

  // Mover la ficha a un ciclo que ya tiene otra chocaría con el par único.
  const repetida = await prisma.inscripcion.findUnique({
    where: { beneficiarioId_ciclo: { beneficiarioId: beneficiario.id, ciclo } },
    select: { id: true },
  });
  if (repetida && repetida.id !== ficha.id) {
    return {
      error: "Revisa los campos marcados.",
      errores: { ciclo: `Ya existe otra inscripción del ciclo ${ciclo}.` },
    };
  }

  const datosEncargado = {
    nombre: v.encargadoNombre,
    parentesco: v.encargadoParentesco || null,
    sexo: v.encargadoSexo || null,
    edad: aEntero(v.encargadoEdad),
    noIdentificacion: v.encargadoIdentificacion || null,
    estadoCivil: v.encargadoEstadoCivil || null,
    situacionLaboral: v.encargadoSituacionLaboral || null,
    escolaridad: v.encargadoEscolaridad || null,
    oficio: v.encargadoOficio || null,
    integrantesFamilia: aEntero(v.encargadoIntegrantes),
    direccion: v.encargadoDireccion || null,
    telefono: v.encargadoTelefono || null,
    email: v.encargadoEmail || null,
  };

  await prisma.$transaction(async (tx) => {
    const encargadoId = beneficiario.encargadoId
      ? (
          await tx.encargado.update({
            where: { id: beneficiario.encargadoId },
            data: datosEncargado,
          })
        ).id
      : (await tx.encargado.create({ data: datosEncargado })).id;

    await tx.beneficiario.update({
      where: { id: beneficiario.id },
      data: {
        escolaridad: v.escolaridad || null,
        sector: v.sector || null,
        telefono: v.telefono || null,
        solicitaPatrocinio: v.solicitaPatrocinio === "on",
        encargadoId,
      },
    });

    await tx.inscripcion.update({
      where: { id: ficha.id },
      data: {
        ciclo,
        fechaInscripcion: fechaDesdeInput(v.fechaInscripcion),
        tipoIngreso: v.tipoIngreso,
        fechaPrimerIngreso: v.fechaPrimerIngreso
          ? fechaDesdeInput(v.fechaPrimerIngreso)
          : null,
        referidoPor: v.referidoPor || null,
        areaServicio: v.areaServicio || null,
        // Quien no puede leer el área clínica tampoco la pisa: se deja como
        // estaba en vez de borrarla con el formulario que no se la enseñó.
        ...(puedeClinico
          ? {
              impresionClinica: v.impresionClinica || null,
              otrasEnfermedades: v.otrasEnfermedades || null,
            }
          : {}),
        responsableInscripcion: v.responsableInscripcion,
        voBo: v.voBo || null,
      },
    });
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Inscripcion",
    entidadId: beneficiario.id,
    detalle: `Ficha de inscripción del ciclo ${ciclo} corregida en el expediente ${beneficiario.codigoExpediente}`,
  });

  revalidatePath("/admin/inscripciones");
  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);
  redirect(`/admin/beneficiarios/${beneficiario.id}#inscripciones`);
}

/* -------------------------------------------------------------------------
   Aceptar una solicitud: la papeleta completa
   ------------------------------------------------------------------------- */

/**
 * Una solicitud del sitio público se convierte en beneficiario de una sola vez.
 * La papeleta se llena entera y solo al aceptar nace el expediente, con su
 * encargado y su ficha del ciclo en la misma transacción: mientras tanto no hay
 * un beneficiario a medio hacer rondando por los listados.
 *
 * No hay borrador intermedio a propósito. La tabla `inscripciones` cuelga de un
 * beneficiario, así que guardar a medias exigiría crearlo antes, que es justo
 * lo que este flujo evita.
 */
const esquemaAceptacion = z.object({
  solicitudId: z.string().min(1),

  // Beneficiario
  codigoExpediente: z
    .string()
    .trim()
    .min(4, "Escribe el código del expediente.")
    .max(30, "El código es demasiado largo."),
  nombres: z.string().trim().min(2, "Escribe los nombres."),
  apellidos: z.string().trim().min(2, "Escribe los apellidos."),
  fechaNacimiento: fecha,
  sexo: z.enum(["MASCULINO", "FEMENINO"], { message: "Indica el sexo." }),
  departamento: z.enum(DEPARTAMENTOS, {
    message: "Selecciona el departamento.",
  }),
  municipio: z.string().trim().min(2, "Escribe el municipio."),
  escolaridad: opcional,
  sector: opcional,
  telefono: opcional,
  solicitaPatrocinio: z.string().optional(),
  programaId: z.string().min(1, "Elige el programa al que ingresa."),
  fechaIngreso: fecha,

  // Encargado
  encargadoNombre: z.string().trim().min(3, "Escribe el nombre del encargado."),
  encargadoParentesco: opcional,
  encargadoSexo: z.enum(["MASCULINO", "FEMENINO", ""]).optional(),
  encargadoEdad: opcional,
  encargadoIdentificacion: opcional,
  encargadoEstadoCivil: opcional,
  encargadoSituacionLaboral: z.enum(["EMPLEADO", "DESEMPLEADO", ""]).optional(),
  encargadoEscolaridad: opcional,
  encargadoOficio: opcional,
  encargadoIntegrantes: opcional,
  encargadoDireccion: opcional,
  encargadoTelefono: opcional,
  encargadoEmail: correoOpcional,

  // Inscripción del ciclo
  ciclo: z
    .string()
    .regex(/^\d{4}$/, "El ciclo es un año de cuatro dígitos.")
    .refine(
      (v) => Number(v) >= 2000 && Number(v) <= 2100,
      "Ciclo fuera de rango.",
    ),
  fechaInscripcion: fecha,
  tipoIngreso: z.enum(["PRIMER_INGRESO", "REINGRESO"], {
    message: "Indica el tipo de ingreso.",
  }),
  fechaPrimerIngreso: z.union([fecha, z.literal("")]).optional(),
  referidoPor: opcional,
  areaServicio: opcional,
  impresionClinica: opcional,
  otrasEnfermedades: opcional,
  responsableInscripcion: z.string().trim().min(3, "Indica quién inscribe."),
  voBo: opcional,
});

export async function aceptarSolicitud(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);
  // Es la bandeja de otra sección: sin poder atenderla no se acepta nada.
  if (!usuario.permisos.includes(PERMISOS.SOLICITUDES_ATENDER)) {
    redirect("/sin-acceso");
  }

  const parseo = esquemaAceptacion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;

  const solicitud = await prisma.supportRequest.findUnique({
    where: { id: v.solicitudId },
    select: { id: true, nombreNino: true, estado: true, beneficiarioId: true },
  });
  if (!solicitud) return { error: "Esa solicitud ya no existe." };
  if (solicitud.beneficiarioId) {
    return {
      error: "Esta solicitud ya se aceptó y tiene su expediente abierto.",
    };
  }
  // El candado del formulario también aquí: la página se puede quedar abierta
  // mientras otra persona devuelve la solicitud a la bandeja o la elimina.
  if (solicitud.estado !== "EN_REVISION") {
    return {
      error:
        "Esta solicitud no está aceptada. Acéptala en Solicitudes para inscribirla.",
    };
  }

  const codigo = v.codigoExpediente.toUpperCase();

  const [repetido, programa] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { codigoExpediente: codigo },
      select: { id: true },
    }),
    prisma.programa.findUnique({
      where: { id: v.programaId },
      select: { id: true, nombre: true },
    }),
  ]);

  if (repetido) {
    return {
      error: "Revisa los campos marcados.",
      errores: { codigoExpediente: "Ya hay un expediente con este código." },
    };
  }
  if (!programa) {
    return {
      error: "Revisa los campos marcados.",
      errores: { programaId: "Ese programa ya no existe." },
    };
  }

  const ciclo = Number(v.ciclo);
  const puedeClinico = usuario.permisos.includes(
    PERMISOS.EXPEDIENTE_CLINICO_LEER,
  );

  const beneficiario = await prisma.$transaction(async (tx) => {
    const encargado = await tx.encargado.create({
      data: {
        nombre: v.encargadoNombre,
        parentesco: v.encargadoParentesco || null,
        sexo: v.encargadoSexo || null,
        edad: aEntero(v.encargadoEdad),
        noIdentificacion: v.encargadoIdentificacion || null,
        estadoCivil: v.encargadoEstadoCivil || null,
        situacionLaboral: v.encargadoSituacionLaboral || null,
        escolaridad: v.encargadoEscolaridad || null,
        oficio: v.encargadoOficio || null,
        integrantesFamilia: aEntero(v.encargadoIntegrantes),
        direccion: v.encargadoDireccion || null,
        telefono: v.encargadoTelefono || null,
        email: v.encargadoEmail || null,
      },
      select: { id: true },
    });

    const creado = await tx.beneficiario.create({
      data: {
        codigoExpediente: codigo,
        nombres: v.nombres,
        apellidos: v.apellidos,
        fechaNacimiento: fechaDesdeInput(v.fechaNacimiento),
        sexo: v.sexo,
        municipio: v.municipio,
        departamento: v.departamento,
        escolaridad: v.escolaridad || null,
        sector: v.sector || null,
        telefono: v.telefono || null,
        solicitaPatrocinio: v.solicitaPatrocinio === "on",
        fechaIngreso: fechaDesdeInput(v.fechaIngreso),
        programaId: programa.id,
        encargadoId: encargado.id,
      },
      select: { id: true },
    });

    await tx.inscripcion.create({
      data: {
        beneficiarioId: creado.id,
        ciclo,
        fechaInscripcion: fechaDesdeInput(v.fechaInscripcion),
        tipoIngreso: v.tipoIngreso,
        fechaPrimerIngreso: v.fechaPrimerIngreso
          ? fechaDesdeInput(v.fechaPrimerIngreso)
          : null,
        referidoPor: v.referidoPor || null,
        areaServicio: v.areaServicio || null,
        impresionClinica: puedeClinico ? v.impresionClinica || null : null,
        otrasEnfermedades: puedeClinico ? v.otrasEnfermedades || null : null,
        responsableInscripcion: v.responsableInscripcion,
        voBo: v.voBo || null,
      },
    });

    // Se archiva al cerrarse el ciclo: ya no es trabajo pendiente en ninguna
    // bandeja, y queda en el historial de solicitudes archivadas con el
    // enlace a su expediente, que es donde se busca de aquí en adelante.
    await tx.supportRequest.update({
      where: { id: solicitud.id },
      data: { estado: "APROBADA", beneficiarioId: creado.id, archivada: true },
    });

    return creado;
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Expediente ${codigo} abierto e inscrito en el ciclo ${ciclo} al aceptar la solicitud de ${solicitud.nombreNino}`,
  });

  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/beneficiarios");
  // El contador de pendientes de la barra lateral se arma en el layout.
  revalidatePath("/admin", "layout");

  redirect(`/admin/beneficiarios/${beneficiario.id}`);
}
