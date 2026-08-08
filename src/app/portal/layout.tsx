import Link from "next/link";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Logo } from "@/components/publico";
import { CerrarSesion } from "@/components/cerrar-sesion";

export default async function LayoutPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  // Autorización en el servidor, no solo en el proxy.
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav aria-label="Portal del padrino">
              <Link
                href="/portal"
                className="text-sm font-semibold text-ink hover:text-brand-primary"
              >
                Mis apadrinados
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-ink-soft">{usuario.nombre}</p>
            <CerrarSesion />
          </div>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1">
        {children}
      </main>

      <footer className="superficie-oscura mt-12 bg-brand-dark text-white">
        <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-white/70">
          Portal del padrino · CERNACE. Ves únicamente los avances que el
          personal marcó como visibles para el padrino.
        </p>
      </footer>
    </div>
  );
}
