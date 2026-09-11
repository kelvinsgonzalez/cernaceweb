import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SesionUsuario } from "@/auth.config";
import type { ClavePermiso } from "@/lib/rbac";

/**
 * `requirePermiso()` corre al inicio de cada página y de cada server action: si
 * el rol no puede leer un dato, la consulta ni siquiera se ejecuta. `src/proxy.ts`
 * solo es conveniencia de navegación, no control de acceso.
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
  if (!permisos.some((p) => usuario.permisos.includes(p)))
    redirect("/sin-acceso");
  return usuario;
}

export type EntradaAuditoria = {
  actor: string;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
};

/** IP de quien pide. Fuera de una petición —una tarea, el seed— no hay ninguna. */
export async function ipDeLaPeticion(): Promise<string | null> {
  try {
    const cabeceras = await headers();
    return (
      cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      cabeceras.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

/**
 * Fila de bitácora lista para escribir. Se expone aparte de
 * `registrarAuditoria()` para lo que borra: ahí la bitácora es la única copia
 * que queda, así que tiene que escribirse dentro de la misma transacción que el
 * borrado y no después, cuando ya no habría de dónde sacar el detalle.
 */
export async function filaAuditoria(entrada: EntradaAuditoria) {
  return {
    actor: entrada.actor,
    accion: entrada.accion,
    entidad: entrada.entidad,
    entidadId: entrada.entidadId ?? null,
    detalle: entrada.detalle ?? null,
    ip: await ipDeLaPeticion(),
  };
}

export async function registrarAuditoria(entrada: EntradaAuditoria) {
  await prisma.auditLog.create({ data: await filaAuditoria(entrada) });
}
