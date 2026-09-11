"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";

/**
 * Mantenimiento de la ficha del padrino. La asignación a un beneficiario vive
 * en /admin/asignaciones y pide otro permiso: aquí solo se administra a la
 * persona que sostiene el aporte, no a quién sostiene.
 *
 * El correo es la llave de la ficha y también con el que entra al portal, así
 * que solo se deja cambiar mientras no haya cuenta enlazada: si no, la ficha y
 * la cuenta quedarían apuntando a correos distintos.
 */

const opcional = (max: number, mensaje: string) =>
  z.string().trim().max(max, mensaje).optional();

const camposFicha = {
  nombre: z.string().trim().min(3, "Escribe el nombre completo o el de la organización."),
  telefono: opcional(30, "El teléfono es demasiado largo."),
  direccion: opcional(200, "La dirección es demasiado larga."),
  ocupacion: opcional(120, "La ocupación es demasiado larga."),
  nit: opcional(20, "El NIT es demasiado largo."),
};

const esquemaNuevo = z.object({
  ...camposFicha,
  email: z.email("Escribe un correo válido."),
});

const esquemaEdicion = z.object({
  ...camposFicha,
  id: z.string().min(1),
  email: z.email("Escribe un correo válido."),
});

const contrasena = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede pasar de 72 caracteres.");

const esquemaAcceso = z
  .object({
    padrinoId: z.string().min(1),
    password: contrasena,
    passwordConfirmacion: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

/** Los opcionales vacíos se guardan como null, no como cadena vacía. */
function oNulo(valor: string | undefined): string | null {
  return valor && valor.length > 0 ? valor : null;
}

export async function crearPadrino(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.PADRINOS_GESTIONAR);

  const parseo = esquemaNuevo.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const email = v.email.toLowerCase();

  const yaExiste = await prisma.padrino.findUnique({
    where: { email },
    select: { id: true },
  });
  if (yaExiste) {
    return {
      error: "Revisa los campos marcados.",
      errores: { email: "Ya hay un padrino registrado con este correo." },
    };
  }

  const padrino = await prisma.padrino.create({
    data: {
      nombre: v.nombre,
      email,
      telefono: oNulo(v.telefono),
      direccion: oNulo(v.direccion),
      ocupacion: oNulo(v.ocupacion),
      nit: oNulo(v.nit),
    },
    select: { id: true },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "Padrino",
    entidadId: padrino.id,
    detalle: `Ficha de padrino creada para ${v.nombre} (${email})`,
  });

  revalidatePath("/admin/donantes");
  revalidatePath("/admin/asignaciones");

  return {
    ok: `${v.nombre} quedó registrado. Ya puedes asignarle un beneficiario.`,
  };
}

export async function actualizarPadrino(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.PADRINOS_GESTIONAR);

  const parseo = esquemaEdicion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const email = v.email.toLowerCase();

  const padrino = await prisma.padrino.findUnique({
    where: { id: v.id },
    select: { id: true, email: true, userId: true },
  });
  if (!padrino) return { error: "Esa ficha ya no existe." };

  const cambiaCorreo = email !== padrino.email;

  if (cambiaCorreo && padrino.userId) {
    return {
      error: "Revisa los campos marcados.",
      errores: {
        email:
          "Este padrino ya tiene cuenta y entra al portal con este correo. Para cambiarlo hay que hacerlo desde la cuenta.",
      },
    };
  }

  if (cambiaCorreo) {
    const ocupado = await prisma.padrino.findUnique({
      where: { email },
      select: { id: true },
    });
    if (ocupado) {
      return {
        error: "Revisa los campos marcados.",
        errores: { email: "Ya hay un padrino registrado con este correo." },
      };
    }
  }

  await prisma.padrino.update({
    where: { id: padrino.id },
    data: {
      nombre: v.nombre,
      email,
      telefono: oNulo(v.telefono),
      direccion: oNulo(v.direccion),
      ocupacion: oNulo(v.ocupacion),
      nit: oNulo(v.nit),
    },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "Padrino",
    entidadId: padrino.id,
    detalle: `Ficha de ${v.nombre} (${email}) actualizada`,
  });

  revalidatePath("/admin/donantes");
  revalidatePath(`/admin/donantes/${padrino.id}`);
  revalidatePath("/admin/asignaciones");

  return { ok: "Cambios guardados." };
}

/**
 * La baja no borra nada: la ficha deja de aparecer como disponible para
 * asignar. Un padrino con apadrinamientos vivos no se da de baja hasta darlos
 * por terminados, para que ningún niño se quede sin patrocinio de callada.
 */
export async function cambiarEstadoPadrino(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.PADRINOS_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  const activar = String(datos.get("activar") ?? "") === "si";
  if (!id) return { error: "Esa ficha ya no existe." };

  const padrino = await prisma.padrino.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      _count: { select: { padrinazgos: { where: { activo: true } } } },
    },
  });
  if (!padrino) return { error: "Esa ficha ya no existe." };
  if (padrino.activo === activar) return {};

  if (!activar && padrino._count.padrinazgos > 0) {
    return {
      error:
        "Tiene apadrinamientos activos. Dalos por terminados en Asignaciones antes de darlo de baja.",
    };
  }

  await prisma.padrino.update({ where: { id }, data: { activo: activar } });

  await registrarAuditoria({
    actor: actor.email,
    accion: activar ? "ACTIVAR" : "DESACTIVAR",
    entidad: "Padrino",
    entidadId: id,
    detalle: `Ficha de ${padrino.nombre} (${padrino.email}) ${activar ? "reactivada" : "dada de baja"}`,
  });

  revalidatePath("/admin/donantes");
  revalidatePath(`/admin/donantes/${id}`);
  revalidatePath("/admin/asignaciones");

  return { ok: activar ? "Ficha reactivada." : "Ficha dada de baja." };
}

/**
 * La cuenta del portal. El rol va fijo en el código: por aquí no se puede
 * crear una cuenta con más permisos que los del padrino, aunque quien lo haga
 * no administre las cuentas del centro.
 */
export async function crearAccesoPadrino(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.PADRINOS_GESTIONAR);

  const parseo = esquemaAcceso.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const padrino = await prisma.padrino.findUnique({
    where: { id: v.padrinoId },
    select: { id: true, nombre: true, email: true, userId: true, activo: true },
  });
  if (!padrino) return { error: "Esa ficha ya no existe." };
  if (padrino.userId) {
    return {
      error:
        "Este padrino ya tiene cuenta. Para cambiarle la contraseña o desactivarla, se hace desde Usuarios.",
    };
  }
  if (!padrino.activo) {
    return { error: "La ficha está dada de baja. Reactívala antes de darle acceso." };
  }

  const ocupado = await prisma.user.findUnique({
    where: { email: padrino.email },
    select: { id: true },
  });
  if (ocupado) {
    return {
      error:
        "Ya hay una cuenta con el correo de esta ficha. Enlázala desde Usuarios asignándole el rol de padrino.",
    };
  }

  const passwordHash = await bcrypt.hash(v.password, 10);

  const usuario = await prisma.$transaction(async (tx) => {
    const creado = await tx.user.create({
      data: {
        nombre: padrino.nombre,
        email: padrino.email,
        passwordHash,
        cargo: "Padrino",
        roles: { create: [{ role: { connect: { clave: ROLES.PADRINO } } }] },
      },
      select: { id: true },
    });
    await tx.padrino.update({
      where: { id: padrino.id },
      data: { userId: creado.id },
    });
    return creado;
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "User",
    entidadId: usuario.id,
    detalle: `Acceso al portal creado para el padrino ${padrino.nombre} (${padrino.email})`,
  });

  revalidatePath("/admin/donantes");
  revalidatePath(`/admin/donantes/${padrino.id}`);
  revalidatePath("/admin/usuarios");

  return {
    ok: `Cuenta creada. Comunícale el correo ${padrino.email} y la contraseña por un medio seguro.`,
  };
}
