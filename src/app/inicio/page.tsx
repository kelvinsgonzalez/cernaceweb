import { redirect } from "next/navigation";
import { requireSesion } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * Punto de aterrizaje tras iniciar sesión: decide el destino según lo que el
 * rol puede hacer. El personal va al panel; el padrino, a su portal.
 */
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

  redirect("/sin-acceso");
}
