import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SesionUsuario } from "@/auth.config";
import type { ClavePermiso } from "@/lib/rbac";

/**
 * Autorización del lado del servidor.
 *
 * Regla no negociable: `requirePermiso()` corre al inicio de cada página y de
 * cada server action. Ocultar un bloque con CSS no cuenta como control de
 * acceso; si el rol no puede leer un dato, la consulta ni siquiera se ejecuta.
 * `src/proxy.ts` solo es conveniencia de navegación.
 */

export async function usuarioActual(): Promise<SesionUsuario | null> {
  const sesion = await auth();
  if (!sesion?.user) return null;
  return sesion.user as unknown as SesionUsuario;
}

export async function requireSesion(): Promise<SesionUsuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

export function tienePermiso(
  usuario: SesionUsuario | null,
  permiso: ClavePermiso,
): boolean {
  return usuario?.permisos.includes(permiso) ?? false;
}

export function tieneAlguno(
  usuario: SesionUsuario | null,
  permisos: ClavePermiso[],
): boolean {
  return permisos.some((p) => tienePermiso(usuario, p));
}

/** Corta la petición con redirect si falta el permiso. */
export async function requirePermiso(
  permiso: ClavePermiso,
): Promise<SesionUsuario> {
  const usuario = await requireSesion();
  if (!usuario.permisos.includes(permiso)) redirect("/sin-acceso");
  return usuario;
}

export async function requireAlgunPermiso(
  permisos: ClavePermiso[],
): Promise<SesionUsuario> {
  const usuario = await requireSesion();
  if (!permisos.some((p) => usuario.permisos.includes(p))) redirect("/sin-acceso");
  return usuario;
}

/** Escribe en la bitácora. Toda apertura de expediente y todo cambio pasa por aquí. */
export async function registrarAuditoria(entrada: {
  actor: string;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
}) {
  let ip: string | null = null;
  try {
    const cabeceras = await headers();
    ip =
      cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      cabeceras.get("x-real-ip") ??
      null;
  } catch {
    ip = null;
  }

  await prisma.auditLog.create({
    data: {
      actor: entrada.actor,
      accion: entrada.accion,
      entidad: entrada.entidad,
      entidadId: entrada.entidadId ?? null,
      detalle: entrada.detalle ?? null,
      ip,
    },
  });
}
