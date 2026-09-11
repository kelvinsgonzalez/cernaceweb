import { redirect } from "next/navigation";
import { requireSesion } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** Reparte al panel o al portal según los permisos del rol. */
export default async function InicioPage() {
  const usuario = await requireSesion();

  if (
    usuario.permisos.includes(PERMISOS.EXPEDIENTE_LEER) ||
    usuario.permisos.includes(PERMISOS.USUARIOS_GESTIONAR) ||
    usuario.permisos.includes(PERMISOS.DONACIONES_LEER)
  ) {
    redirect("/admin");
  }

  if (usuario.permisos.includes(PERMISOS.PORTAL_PADRINO)) {
    redirect("/portal");
  }

  if (usuario.permisos.includes(PERMISOS.PORTAL_BENEFICIARIO)) {
    redirect("/mi-expediente");
  }

  redirect("/sin-acceso");
}
