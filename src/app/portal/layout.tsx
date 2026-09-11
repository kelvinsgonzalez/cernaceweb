import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { modulosVisibles } from "@/lib/navegacion";
import { Logo } from "@/components/logo";
import { MenuFlotante } from "@/components/menu-flotante";
import { CerrarSesion } from "@/components/cerrar-sesion";

export default async function LayoutPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  // Autorización en el servidor, no solo en el proxy.
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);
  const modulos = modulosVisibles(usuario.permisos);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>

      <MenuFlotante
        titulo="Portal del padrino"
        subtitulo={usuario.nombre}
        inicio="/portal"
        modulos={modulos}
        identidad={{ nombre: usuario.nombre, detalle: usuario.email }}
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Logo />
            <NavegacionPortal modulos={modulos} />
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

      <footer className="superficie-oscura franja-tinta mt-12">
        <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-crema/70">
          Portal del padrino · CERNACE. Ves únicamente los avances que el
          personal marcó como visibles para el padrino.
        </p>
      </footer>
    </div>
  );
}

/** La misma lista de módulos del menú flotante, en horizontal. */
function NavegacionPortal({
  modulos,
}: {
  modulos: ReturnType<typeof modulosVisibles>;
}) {
  return (
    <nav aria-label="Portal del padrino">
      <ul className="flex items-center gap-6 text-sm font-semibold">
        {modulos.map((modulo) => (
          <li key={modulo.href}>
            <Link
              href={modulo.href}
              className="enlace-vivo text-ink hover:text-brand-primary"
            >
              {modulo.etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
