"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";

/**
 * Alta y mantenimiento de cuentas. Aquí solo se asignan roles: los permisos de
 * cada rol viven en la base (tabla roles_permisos) y no se editan desde la
 * interfaz, así que el límite de una cuenta es exactamente el de sus roles.
 *
 * Tres salvaguardas impiden que un administrador se deje fuera del sistema:
 * nadie puede desactivar su propia cuenta, nadie puede quitarse su propio rol
 * ADMIN y nunca puede quedar el sistema sin un ADMIN activo.
 */

const CLAVES_ROL = Object.values(ROLES) as [string, ...string[]];

const contrasena = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede pasar de 72 caracteres.");

const esquemaNuevo = z
  .object({
    nombre: z.string().trim().min(3, "Escribe el nombre completo."),
    email: z.email("Escribe un correo válido."),
    cargo: z.string().trim().optional(),
    password: contrasena,
    passwordConfirmacion: z.string(),
    roles: z.array(z.enum(CLAVES_ROL)).min(1, "Asigna al menos un rol."),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

const esquemaEdicion = z.object({
  id: z.string().min(1),
  nombre: z.string().trim().min(3, "Escribe el nombre completo."),
  cargo: z.string().trim().optional(),
  roles: z.array(z.enum(CLAVES_ROL)).min(1, "Asigna al menos un rol."),
});

const esquemaContrasena = z
  .object({
    id: z.string().min(1),
    password: contrasena,
    passwordConfirmacion: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

function rolesDelFormulario(datos: FormData): string[] {
  return datos.getAll("roles").map(String).filter(Boolean);
}

/** Cuántas cuentas activas conservan el rol ADMIN, excluyendo una si se indica. */
async function adminsActivos(excluyendo?: string): Promise<number> {
  return prisma.user.count({
    where: {
      activo: true,
      ...(excluyendo ? { id: { not: excluyendo } } : {}),
      roles: { some: { role: { clave: ROLES.ADMIN } } },
    },
  });
}

/**
 * El rol PADRINO no basta para entrar al portal: la consulta parte de
 * `padrinoId`, que sale de la ficha `Padrino`. Al conceder el rol se enlaza la
 * ficha existente con ese correo o se crea una nueva; al retirarlo se desenlaza
 * sin borrarla, para no arrastrar los padrinazgos ni las donaciones.
 */
async function sincronizarFichaPadrino(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  usuario: { id: string; nombre: string; email: string },
  esPadrino: boolean,
) {
  const ficha = await tx.padrino.findUnique({
    where: { email: usuario.email },
    select: { id: true, userId: true },
  });

  if (esPadrino) {
    if (!ficha) {
      await tx.padrino.create({
        data: { userId: usuario.id, nombre: usuario.nombre, email: usuario.email },
      });
      return "creada" as const;
    }
    if (ficha.userId === usuario.id) return "sin cambios" as const;
    await tx.padrino.update({
      where: { id: ficha.id },
      data: { userId: usuario.id },
    });
    return "enlazada" as const;
  }

  if (ficha?.userId === usuario.id) {
    await tx.padrino.update({ where: { id: ficha.id }, data: { userId: null } });
    return "desenlazada" as const;
  }
  return "sin cambios" as const;
}

export async function crearUsuario(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const parseo = esquemaNuevo.safeParse({
    ...Object.fromEntries(datos),
    roles: rolesDelFormulario(datos),
  });
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  // `authorize()` busca el correo en minúsculas al iniciar sesión.
  const email = v.email.toLowerCase();

  const yaExiste = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (yaExiste) {
    return {
      error: "Revisa los campos marcados.",
      errores: { email: "Ya hay una cuenta con este correo." },
    };
  }

  const esPadrino = v.roles.includes(ROLES.PADRINO);
  if (esPadrino) {
    const ficha = await prisma.padrino.findUnique({
      where: { email },
      select: { userId: true },
    });
    if (ficha?.userId) {
      return {
        error: "Revisa los campos marcados.",
        errores: { email: "Ese correo ya pertenece a otro padrino con acceso." },
      };
    }
  }

  const passwordHash = await bcrypt.hash(v.password, 10);

  const { usuario, ficha } = await prisma.$transaction(async (tx) => {
    const usuario = await tx.user.create({
      data: {
        nombre: v.nombre,
        email,
        passwordHash,
        cargo: v.cargo || null,
        roles: {
          create: v.roles.map((clave) => ({ role: { connect: { clave } } })),
        },
      },
      select: { id: true, nombre: true, email: true },
    });

    const ficha = await sincronizarFichaPadrino(tx, usuario, esPadrino);
    return { usuario, ficha };
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "User",
    entidadId: usuario.id,
    detalle: `Cuenta creada para ${v.nombre} (${email}) con los roles ${v.roles.join(", ")}`,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/asignaciones");

  const nota =
    ficha === "creada"
      ? " Se creó también su ficha de padrino."
      : ficha === "enlazada"
        ? " Se enlazó con la ficha de padrino que ya existía con ese correo."
        : "";

  return { ok: `Cuenta de ${v.nombre} creada.${nota}` };
}

export async function actualizarUsuario(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const parseo = esquemaEdicion.safeParse({
    ...Object.fromEntries(datos),
    roles: rolesDelFormulario(datos),
  });
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const usuario = await prisma.user.findUnique({
    where: { id: v.id },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      roles: { select: { role: { select: { clave: true } } } },
    },
  });
  if (!usuario) return { error: "Esa cuenta ya no existe." };

  const eraAdmin = usuario.roles.some((r) => r.role.clave === ROLES.ADMIN);
  const seraAdmin = v.roles.includes(ROLES.ADMIN);

  if (eraAdmin && !seraAdmin) {
    if (usuario.id === actor.id) {
      return { error: "No puedes quitarte a ti mismo el rol de administrador." };
    }
    if (usuario.activo && (await adminsActivos(usuario.id)) === 0) {
      return {
        error:
          "Es el único administrador activo. Asigna el rol a otra cuenta antes de retirárselo.",
      };
    }
  }

  const esPadrino = v.roles.includes(ROLES.PADRINO);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: v.id },
      data: { nombre: v.nombre, cargo: v.cargo || null },
    });

    // Se reemplaza el juego completo de roles: es más simple de razonar que
    // calcular altas y bajas, y la tabla es un par de filas por usuario.
    await tx.userRole.deleteMany({ where: { userId: v.id } });
    for (const clave of v.roles) {
      const rol = await tx.role.findUnique({
        where: { clave },
        select: { id: true },
      });
      if (rol) await tx.userRole.create({ data: { userId: v.id, roleId: rol.id } });
    }

    await sincronizarFichaPadrino(
      tx,
      { id: usuario.id, nombre: v.nombre, email: usuario.email },
      esPadrino,
    );
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "User",
    entidadId: v.id,
    detalle: `Cuenta de ${usuario.email} actualizada. Roles: ${v.roles.join(", ")}`,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${v.id}`);
  revalidatePath("/admin/asignaciones");

  return {
    ok: "Cambios guardados. Los permisos nuevos se aplican la próxima vez que la persona inicie sesión.",
  };
}

export async function cambiarEstadoUsuario(datos: FormData) {
  const actor = await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  const activar = String(datos.get("activar") ?? "") === "si";
  if (!id) return;

  // Desactivarse a uno mismo deja la sesión en marcha pero sin poder volver a
  // entrar, así que se bloquea aquí además de ocultarse el botón.
  if (id === actor.id) return;

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      roles: { select: { role: { select: { clave: true } } } },
    },
  });
  if (!usuario || usuario.activo === activar) return;

  const esAdmin = usuario.roles.some((r) => r.role.clave === ROLES.ADMIN);
  if (!activar && esAdmin && (await adminsActivos(usuario.id)) === 0) return;

  await prisma.user.update({ where: { id }, data: { activo: activar } });

  await registrarAuditoria({
    actor: actor.email,
    accion: activar ? "ACTIVAR" : "DESACTIVAR",
    entidad: "User",
    entidadId: id,
    detalle: `Cuenta de ${usuario.email} ${activar ? "reactivada" : "desactivada"}`,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
}

export async function restablecerContrasena(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const parseo = esquemaContrasena.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const usuario = await prisma.user.findUnique({
    where: { id: v.id },
    select: { email: true },
  });
  if (!usuario) return { error: "Esa cuenta ya no existe." };

  await prisma.user.update({
    where: { id: v.id },
    data: { passwordHash: await bcrypt.hash(v.password, 10) },
  });

  // La contraseña nunca se escribe en la bitácora: solo el hecho del cambio.
  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "User",
    entidadId: v.id,
    detalle: `Contraseña restablecida para ${usuario.email}`,
  });

  return {
    ok: "Contraseña actualizada. Comunícasela a la persona por un medio seguro.",
  };
}

const esquemaAcceso = z
  .object({
    beneficiarioId: z.string().min(1),
    nombre: z.string().trim().min(3, "Escribe a nombre de quién va la cuenta."),
    email: z.email("Escribe un correo válido."),
    password: contrasena,
    passwordConfirmacion: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

/**
 * Crea la cuenta con la que una familia consulta su expediente.
 *
 * La cuenta se ata al beneficiario por `Beneficiario.userId`, igual que la del
 * padrino se ata por `Padrino.userId`: el portal parte de ese enlace y no de
 * ningún id de la URL. El rol BENEFICIARIO solo trae portal.beneficiario, así
 * que la cuenta no puede escribir nada.
 *
 * Pide `beneficiario.acceso` y no `usuarios.gestionar`: quien lleva los
 * expedientes puede abrirle la puerta a la familia sin poder tocar el resto de
 * las cuentas. El rol que se concede está fijo en el código, así que por aquí
 * no se puede crear una cuenta con más permisos.
 */
export async function crearAccesoBeneficiario(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.BENEFICIARIO_ACCESO);

  const parseo = esquemaAcceso.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const email = v.email.toLowerCase();

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id: v.beneficiarioId },
    select: { id: true, userId: true, codigoExpediente: true, nombres: true },
  });
  if (!beneficiario) return { error: "Ese beneficiario ya no existe." };
  if (beneficiario.userId) {
    return {
      error:
        "Este expediente ya tiene una cuenta. Para cambiar la contraseña o desactivarla, ve a Usuarios.",
    };
  }

  const ocupado = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (ocupado) {
    return {
      error: "Revisa los campos marcados.",
      errores: { email: "Ya hay una cuenta con este correo." },
    };
  }

  const passwordHash = await bcrypt.hash(v.password, 10);

  const usuario = await prisma.$transaction(async (tx) => {
    const creado = await tx.user.create({
      data: {
        nombre: v.nombre,
        email,
        passwordHash,
        cargo: `Familia de ${beneficiario.codigoExpediente}`,
        roles: { create: [{ role: { connect: { clave: ROLES.BENEFICIARIO } } }] },
      },
      select: { id: true },
    });
    await tx.beneficiario.update({
      where: { id: beneficiario.id },
      data: { userId: creado.id },
    });
    return creado;
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "User",
    entidadId: usuario.id,
    detalle: `Acceso al expediente ${beneficiario.codigoExpediente} creado para ${v.nombre} (${email})`,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/beneficiarios/${beneficiario.id}`);

  return {
    ok: `Cuenta creada. Comunícale a la familia el correo ${email} y la contraseña por un medio seguro.`,
  };
}
