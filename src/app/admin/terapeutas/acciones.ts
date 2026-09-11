"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";

/**
 * Alta y mantenimiento del equipo terapéutico. Es un recorte deliberado de
 * /admin/usuarios: `terapeutas.gestionar` no es `usuarios.gestionar`.
 *
 * Dos límites lo mantienen así, y los dos se comprueban en el servidor:
 * el rol que se concede está escrito en el código —siempre TERAPEUTA, nunca
 * viene del formulario— y toda edición pasa por `terapeutaEditable()`, que
 * rechaza cualquier cuenta que no sea exactamente la de un terapeuta. Sin eso,
 * quien lleva el equipo podría cambiarle la contraseña a un administrador y
 * quedarse con sus permisos.
 */

const contrasena = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede pasar de 72 caracteres.");

const esquemaNuevo = z
  .object({
    nombre: z.string().trim().min(3, "Escribe el nombre completo."),
    email: z.email("Escribe un correo válido."),
    cargo: z.string().trim().max(120, "El cargo es demasiado largo.").optional(),
    password: contrasena,
    passwordConfirmacion: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

const esquemaEdicion = z.object({
  id: z.string().min(1),
  nombre: z.string().trim().min(3, "Escribe el nombre completo."),
  cargo: z.string().trim().max(120, "El cargo es demasiado largo.").optional(),
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

type Terapeuta = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
};

/**
 * Devuelve la cuenta solo si es la de un terapeuta y de nadie más: una cuenta
 * que además sea ADMIN o DIRECCION queda fuera del alcance de esta sección y
 * se administra desde /admin/usuarios.
 */
async function terapeutaEditable(id: string): Promise<Terapeuta | null> {
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
  if (!usuario) return null;

  const claves = usuario.roles.map((r) => r.role.clave);
  const esTerapeuta = claves.includes(ROLES.TERAPEUTA);
  const soloTerapeuta = claves.every((c) => c === ROLES.TERAPEUTA);
  if (!esTerapeuta || !soloTerapeuta) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    activo: usuario.activo,
  };
}

const FUERA_DE_ALCANCE =
  "Esa cuenta no es solo de terapeuta, así que se administra desde Usuarios y roles.";

export async function crearTerapeuta(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const parseo = esquemaNuevo.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  // `authorize()` busca el correo en minúsculas al iniciar sesión.
  const email = v.email.toLowerCase();

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

  const usuario = await prisma.user.create({
    data: {
      nombre: v.nombre,
      email,
      passwordHash,
      cargo: v.cargo || "Terapeuta",
      roles: { create: [{ role: { connect: { clave: ROLES.TERAPEUTA } } }] },
    },
    select: { id: true },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "User",
    entidadId: usuario.id,
    detalle: `Cuenta de terapeuta creada para ${v.nombre} (${email})`,
  });

  revalidatePath("/admin/terapeutas");
  revalidatePath("/admin/terapia");
  revalidatePath("/admin/usuarios");

  return {
    ok: `${v.nombre} ya puede atender casos. Comunícale la contraseña por un medio seguro.`,
  };
}

export async function actualizarTerapeuta(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const parseo = esquemaEdicion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const terapeuta = await terapeutaEditable(v.id);
  if (!terapeuta) return { error: FUERA_DE_ALCANCE };

  await prisma.user.update({
    where: { id: terapeuta.id },
    data: { nombre: v.nombre, cargo: v.cargo || "Terapeuta" },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "User",
    entidadId: terapeuta.id,
    detalle: `Datos del terapeuta ${terapeuta.email} actualizados`,
  });

  revalidatePath("/admin/terapeutas");
  revalidatePath(`/admin/terapeutas/${terapeuta.id}`);
  revalidatePath("/admin/terapia");

  return { ok: "Cambios guardados." };
}

/**
 * Dar de baja cierra también los casos que llevaba, con la fecha de hoy: una
 * asignación viva de alguien que ya no puede entrar dejaría al niño sin nadie
 * que le registre avances sin que se notara en la lista de terapia.
 */
export async function cambiarEstadoTerapeuta(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  const activar = String(datos.get("activar") ?? "") === "si";
  if (!id) return { error: "Esa cuenta ya no existe." };

  const terapeuta = await terapeutaEditable(id);
  if (!terapeuta) return { error: FUERA_DE_ALCANCE };
  if (terapeuta.activo === activar) return {};

  const hoy = new Date();
  let cerrados = 0;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { activo: activar } });
    if (!activar) {
      const baja = await tx.asignacionTerapeuta.updateMany({
        where: { terapeutaId: id, activo: true },
        data: { activo: false, hasta: hoy },
      });
      cerrados = baja.count;
    }
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: activar ? "ACTIVAR" : "DESACTIVAR",
    entidad: "User",
    entidadId: id,
    detalle: activar
      ? `Cuenta del terapeuta ${terapeuta.email} reactivada`
      : `Cuenta del terapeuta ${terapeuta.email} desactivada; se cerraron ${cerrados} ${cerrados === 1 ? "caso" : "casos"}`,
  });

  revalidatePath("/admin/terapeutas");
  revalidatePath(`/admin/terapeutas/${id}`);
  revalidatePath("/admin/terapia");
  revalidatePath("/admin/usuarios");

  if (activar) {
    return {
      ok: "Cuenta reactivada. Vuélvele a asignar sus casos desde Terapia.",
    };
  }

  return {
    ok:
      cerrados === 0
        ? "Cuenta desactivada."
        : `Cuenta desactivada. Se cerraron ${cerrados} ${cerrados === 1 ? "caso que llevaba" : "casos que llevaba"}: reasígnalos desde Terapia.`,
  };
}

export async function restablecerContrasenaTerapeuta(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const parseo = esquemaContrasena.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const v = parseo.data;
  const terapeuta = await terapeutaEditable(v.id);
  if (!terapeuta) return { error: FUERA_DE_ALCANCE };

  await prisma.user.update({
    where: { id: terapeuta.id },
    data: { passwordHash: await bcrypt.hash(v.password, 10) },
  });

  // La contraseña nunca se escribe en la bitácora: solo el hecho del cambio.
  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "User",
    entidadId: terapeuta.id,
    detalle: `Contraseña restablecida para el terapeuta ${terapeuta.email}`,
  });

  return {
    ok: "Contraseña actualizada. Comunícasela por un medio seguro.",
  };
}
