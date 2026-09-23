"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { METODO_DEPOSITO, generarReferencia } from "@/lib/pasarela";
import { registrarAuditoria, usuarioActual } from "@/lib/sesion";
import { ROLES } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { guardarBoleta, validarBoleta } from "@/lib/almacenamiento";
import {
  erroresDeZod,
  esquemaContacto,
  esquemaAporteCampana,
  esquemaInscripcionBeneficiario,
  esquemaInscripcionPadrino,
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
 * Aporte a una campaña desde la portada (o a la general «Aportar a lo que se
 * necesite»). La foto del comprobante llega en el mismo paso que crea el
 * aporte; el nombre y el mensaje son opcionales. Si quien aporta tiene la
 * sesión abierta, el aporte queda ligado a su cuenta.
 *
 * Nace PENDIENTE y sin monto: el dinero no está confirmado hasta que el
 * administrador coteja la foto contra el estado de cuenta desde
 * /admin/donaciones, y es ahí donde se anota cuánto fue.
 */
export async function registrarAporteCampana(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const parseo = esquemaAporteCampana.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const entrante = datos.get("boleta");
  if (!(entrante instanceof File) || entrante.size === 0) {
    return {
      error: "Falta la foto del comprobante.",
      errores: { boleta: "Elige la foto o el PDF de tu comprobante." },
    };
  }
  const problema = validarBoleta(entrante);
  if (problema) {
    return { error: "Revisa el archivo.", errores: { boleta: problema } };
  }

  const v = parseo.data;
  const hoy = new Date();
  // La campaña elegida tiene que seguir abierta: entre que se pintó la página
  // y se envió el formulario, el administrador pudo cerrarla.
  const elegida = v.campana
    ? await prisma.campaign.findFirst({
        where: {
          slug: v.campana,
          activa: true,
          eliminadaEn: null,
          OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
        },
        select: { id: true, titulo: true, general: true },
      })
    : null;
  if (v.campana && !elegida) {
    return {
      error: "Esa campaña ya se cerró.",
      errores: { campana: "Elige otra campaña o aporta a lo que se necesite." },
    };
  }
  const campana =
    elegida ??
    (await prisma.campaign.findFirst({
      where: { general: true },
      select: { id: true, titulo: true, general: true },
    }));

  const usuario = await usuarioActual();

  // El archivo se guarda antes de crear la fila: si el disco falla, no queda
  // un aporte apuntando a un comprobante que no existe.
  const guardado = await guardarBoleta(entrante);

  const donacion = await prisma.donacion.create({
    data: {
      tipo: campana && !campana.general ? "CAMPANA" : "GENERAL",
      campaignId: campana?.id ?? null,
      metodo: METODO_DEPOSITO,
      estado: "PENDIENTE",
      referenciaPasarela: generarReferencia(),
      donanteNombre: v.deParteDe || usuario?.nombre || null,
      donanteEmail: usuario?.email ?? null,
      usuarioId: usuario?.id ?? null,
      padrinoId: usuario?.padrinoId ?? null,
      mensaje: v.mensaje || null,
      boletaArchivo: guardado.archivo,
      boletaTipoMime: guardado.tipoMime,
      boletaTamanoBytes: guardado.tamanoBytes,
      boletaSubidaEn: hoy,
    },
  });

  await registrarAuditoria({
    actor: usuario?.email ?? "sitio-publico",
    accion: "CREAR",
    entidad: "Donacion",
    entidadId: donacion.id,
    detalle: `Aporte con comprobante adjunto · referencia ${donacion.referenciaPasarela} · ${campana?.titulo ?? "sin campaña"}${v.deParteDe ? ` · de parte de ${v.deParteDe}` : ""}`,
  });

  redirect(`/donar/gracias/${donacion.id}`);
}
