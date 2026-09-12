"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { METODO_DEPOSITO, pasarela, requiereBoleta } from "@/lib/pasarela";
import { registrarAuditoria } from "@/lib/sesion";
import { ROLES } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { guardarBoleta, validarBoleta } from "@/lib/almacenamiento";
import {
  erroresDeZod,
  esquemaContacto,
  esquemaDonativoDirecto,
  esquemaInscripcionBeneficiario,
  esquemaInscripcionPadrino,
  esquemaPasarela,
  type EstadoFormulario,
} from "@/lib/formularios";

export async function enviarInscripcionBeneficiario(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaInscripcionBeneficiario.safeParse(
    Object.fromEntries(datos),
  );
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const solicitud = await prisma.supportRequest.create({
    data: {
      nombreNino: v.nombreNino,
      fechaNacimiento: fechaDesdeInput(v.fechaNacimiento),
      sexo: v.sexo,
      municipio: v.municipio,
      departamento: v.departamento,
      encargadoNombre: v.encargadoNombre,
      encargadoParentesco: v.encargadoParentesco,
      encargadoTelefono: v.encargadoTelefono,
      encargadoEmail: v.encargadoEmail || null,
      diagnostico: v.diagnostico || null,
      programaSolicitado: v.programaSolicitado || null,
      comentarios: v.comentarios || null,
    },
  });

  await registrarAuditoria({
    actor: v.encargadoEmail || "sitio-publico",
    accion: "CREAR",
    entidad: "SupportRequest",
    entidadId: solicitud.id,
    detalle: `Inscripción de beneficiario recibida: ${v.nombreNino}`,
  });

  return {
    ok: "Recibimos la inscripción. El equipo de trabajo social se comunicará contigo en los próximos días hábiles.",
  };
}

/**
 * Además de registrar la postulación, crea la cuenta de acceso al portal: un
 * `User` con rol PADRINO y su `Padrino` asociado. La asignación de un
 * beneficiario sigue siendo manual desde el panel.
 */
export async function enviarInscripcionPadrino(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaInscripcionPadrino.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  // `authorize()` busca el correo en minúsculas al iniciar sesión.
  const email = v.email.toLowerCase();

  const [usuarioExistente, padrinoExistente] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.padrino.findUnique({ where: { email }, select: { id: true } }),
  ]);

  if (usuarioExistente || padrinoExistente) {
    return {
      error: "Revisa los campos marcados.",
      errores: {
        email:
          "Ya existe una cuenta con este correo. Inicia sesión o escribe otro.",
      },
    };
  }

  const passwordHash = await bcrypt.hash(v.password, 10);

  const { usuario, postulacion } = await prisma.$transaction(async (tx) => {
    const usuario = await tx.user.create({
      data: {
        nombre: v.nombre,
        email,
        passwordHash,
        cargo: "Padrino",
        roles: { create: [{ role: { connect: { clave: ROLES.PADRINO } } }] },
      },
    });

    await tx.padrino.create({
      data: {
        userId: usuario.id,
        nombre: v.nombre,
        email,
        telefono: v.telefono,
        ocupacion: v.ocupacion || null,
      },
    });

    const postulacion = await tx.volunteerApplication.create({
      data: {
        nombre: v.nombre,
        email,
        telefono: v.telefono,
        tipo: "PADRINO",
        ocupacion: v.ocupacion || null,
        aporteMensual: v.aporteMensual ? v.aporteMensual : null,
        motivacion: v.motivacion || null,
      },
    });

    return { usuario, postulacion };
  });

  await registrarAuditoria({
    actor: email,
    accion: "CREAR",
    entidad: "User",
    entidadId: usuario.id,
    detalle: `Cuenta de padrino creada desde el sitio público: ${v.nombre}`,
  });

  await registrarAuditoria({
    actor: email,
    accion: "CREAR",
    entidad: "VolunteerApplication",
    entidadId: postulacion.id,
    detalle: `Inscripción de padrino recibida: ${v.nombre}`,
  });

  return {
    ok: "Cuenta creada. Ya puedes iniciar sesión con tu correo y contraseña; en cuanto el equipo te asigne un beneficiario lo verás en tu portal.",
  };
}

export async function enviarContacto(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaContacto.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const mensaje = await prisma.contactMessage.create({
    data: {
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono || null,
      asunto: v.asunto,
      mensaje: v.mensaje,
    },
  });

  await registrarAuditoria({
    actor: v.email,
    accion: "CREAR",
    entidad: "ContactMessage",
    entidadId: mensaje.id,
    detalle: `Mensaje de contacto: ${v.asunto}`,
  });

  return { ok: "Mensaje enviado. Te responderemos al correo que indicaste." };
}

/**
 * Pago en línea. La donación nace en PENDIENTE con la referencia de la
 * pasarela y sin ningún dato del donante: lo único que se pidió fue el monto.
 */
export async function iniciarDonacion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaPasarela.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const intencion = await pasarela.crearIntencion({
    monto: Number(v.monto),
    moneda: "GTQ",
    metodo: "TARJETA",
    descripcion: "Donación en línea",
  });

  const donacion = await prisma.donacion.create({
    data: {
      monto: v.monto,
      moneda: intencion.moneda,
      metodo: "TARJETA",
      estado: "PENDIENTE",
      referenciaPasarela: intencion.referencia,
    },
  });

  await registrarAuditoria({
    actor: "sitio-publico",
    accion: "CREAR",
    entidad: "Donacion",
    entidadId: donacion.id,
    detalle: `Donación iniciada por ${intencion.monto} GTQ · referencia ${intencion.referencia}`,
  });

  redirect(`/donar/pagar/${donacion.id}`);
}

export async function confirmarDonacion(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const aprobar = String(datos.get("aprobar") ?? "") === "si";

  const donacion = await prisma.donacion.findUnique({ where: { id } });
  if (!donacion) redirect("/donar");

  // Un depósito no lo aprueba la pasarela: lo aprueba quien coteja la boleta
  // contra el estado de cuenta, desde el panel.
  if (requiereBoleta(donacion.metodo)) redirect(`/donar/gracias/${donacion.id}`);
  if (donacion.estado !== "PENDIENTE") redirect(`/donar/gracias/${donacion.id}`);

  const resultado = await pasarela.confirmar(
    donacion.referenciaPasarela,
    aprobar,
  );

  await prisma.donacion.update({
    where: { id },
    data: { estado: resultado.aprobado ? "COMPLETADA" : "FALLIDA" },
  });

  await registrarAuditoria({
    actor: "sitio-publico",
    accion: resultado.aprobado ? "PAGO_APROBADO" : "PAGO_RECHAZADO",
    entidad: "Donacion",
    entidadId: donacion.id,
    detalle: `${resultado.mensaje} Referencia ${donacion.referenciaPasarela}`,
  });

  redirect(`/donar/gracias/${donacion.id}`);
}

/**
 * Donativo depositado en el banco. A diferencia del pago en línea, aquí la
 * boleta llega en el mismo paso que crea la donación: quien deposita no tiene
 * que dejar nombre ni correo ni volver después a adjuntar nada.
 *
 * Queda PENDIENTE y sin monto. El dinero no está confirmado hasta que alguien
 * del equipo coteja la boleta contra el estado de cuenta desde
 * /admin/donaciones, y es ahí donde se anota cuánto fue.
 */
export async function registrarDonativoDirecto(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaDonativoDirecto.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const entrante = datos.get("boleta");
  if (!(entrante instanceof File) || entrante.size === 0) {
    return {
      error: "Falta la boleta.",
      errores: { boleta: "Elige la foto o el PDF de tu boleta." },
    };
  }
  const problema = validarBoleta(entrante);
  if (problema) {
    return { error: "Revisa el archivo.", errores: { boleta: problema } };
  }

  const destino = parseo.data.destinoNino?.trim() || null;
  const intencion = await pasarela.crearIntencion({
    monto: 0,
    moneda: "GTQ",
    metodo: METODO_DEPOSITO,
    descripcion: "Donativo depositado en el banco",
  });

  // El archivo se guarda antes de crear la fila: si el disco falla, no queda
  // una donación apuntando a una boleta que no existe.
  const guardado = await guardarBoleta(entrante);

  const donacion = await prisma.donacion.create({
    data: {
      metodo: METODO_DEPOSITO,
      estado: "PENDIENTE",
      referenciaPasarela: intencion.referencia,
      destinoNino: destino,
      boletaArchivo: guardado.archivo,
      boletaTipoMime: guardado.tipoMime,
      boletaTamanoBytes: guardado.tamanoBytes,
      boletaSubidaEn: new Date(),
    },
  });

  await registrarAuditoria({
    actor: "sitio-publico",
    accion: "CREAR",
    entidad: "Donacion",
    entidadId: donacion.id,
    detalle: `Donativo directo con boleta adjunta · referencia ${donacion.referenciaPasarela}${destino ? ` · dirigido a ${destino}` : ""}`,
  });

  redirect(`/donar/gracias/${donacion.id}`);
}
