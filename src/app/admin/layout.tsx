import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSesion, tienePermiso } from "@/lib/sesion";
import { nombreDeRol, PERMISOS } from "@/lib/rbac";
import { modulosVisibles } from "@/lib/navegacion";
import { BarraLateral } from "@/components/admin/barra-lateral";
import { MenuFlotante } from "@/components/menu-flotante";
import { CerrarSesion } from "@/components/cerrar-sesion";
import { Logo } from "@/components/logo";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requireSesion();

  // Un padrino que escriba /admin/... en la barra de direcciones acaba aquí.
  const PERMISOS_DE_PANEL = [
    PERMISOS.EXPEDIENTE_LEER,
    PERMISOS.DONACIONES_LEER,
    PERMISOS.USUARIOS_GESTIONAR,
    PERMISOS.AUDITORIA_LEER,
  ];
  if (!PERMISOS_DE_PANEL.some((p) => usuario.permisos.includes(p))) {
    redirect("/sin-acceso");
  }

  // El aviso de la barra lateral: las solicitudes que nadie ha tocado todavía.
  // Solo se cuenta si la persona puede atenderlas; si no, el número le diría
  // algo de una bandeja que ni siquiera ve.
  const contadores = {
    solicitudes: tienePermiso(usuario, PERMISOS.SOLICITUDES_ATENDER)
      ? await prisma.supportRequest.count({
          where: { estado: "NUEVA", archivada: false },
        })
      : 0,
  };

  const modulos = modulosVisibles(usuario.permisos, contadores);
  const roles = usuario.roles.map(nombreDeRol).join(", ");

  return (
    <div className="flex min-h-screen">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>

      <aside className="superficie-oscura franja-tinta sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto lg:block">
        <div className="border-b border-crema/15 px-4 py-4">
          <Logo oscuro />
        </div>
        <BarraLateral modulos={modulos} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Por debajo de `lg` la barra lateral no cabe: la navegación entera,
            junto con la identidad y el cierre de sesión, pasa al menú flotante. */}
        <MenuFlotante
          titulo="Panel de administración"
          subtitulo="CERNACE · Chimaltenango"
          inicio="/admin"
          modulos={modulos}
          identidad={{ nombre: usuario.nombre, detalle: roles }}
          pie={
            <>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-brand-primary"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Ver sitio público
              </Link>
              <CerrarSesion className="ml-auto" />
            </>
          }
        />

        <header className="sticky top-0 z-30 hidden border-b border-line bg-surface/85 backdrop-blur-md lg:block">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                Panel de administración
              </p>
              <p className="text-xs text-ink-soft">CERNACE · Chimaltenango</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-brand-primary"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Ver sitio público
              </Link>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{usuario.nombre}</p>
                <p className="text-xs text-ink-soft">{roles}</p>
              </div>
              <CerrarSesion />
            </div>
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
