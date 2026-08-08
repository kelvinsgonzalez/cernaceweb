import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireSesion } from "@/lib/sesion";
import { nombreDeRol, PERMISOS } from "@/lib/rbac";
import { BarraLateral } from "@/components/admin/barra-lateral";
import { CerrarSesion } from "@/components/cerrar-sesion";
import { Logo } from "@/components/publico";

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

  return (
    <div className="flex min-h-screen">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>

      <aside className="superficie-oscura hidden w-64 shrink-0 bg-brand-dark lg:block">
        <div className="border-b border-white/15 px-4 py-4">
          <Logo oscuro />
        </div>
        <BarraLateral permisos={usuario.permisos} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-ink">Panel de administración</p>
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
                <p className="text-xs text-ink-soft">
                  {usuario.roles.map(nombreDeRol).join(", ")}
                </p>
              </div>
              <CerrarSesion />
            </div>
          </div>

          {/* En móvil la barra lateral se convierte en una lista horizontal. */}
          <div className="border-t border-line lg:hidden">
            <div className="superficie-oscura bg-brand-dark">
              <BarraLateral permisos={usuario.permisos} variante="movil" />
            </div>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
