import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import { Logo } from "@/components/logo";
import { usuarioActual } from "@/lib/sesion";
import { ROLES, nombreDeRol, type ClaveRol } from "@/lib/rbac";
import { FormularioLogin } from "./formulario";
import { iniciarSesion } from "./acciones";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export const dynamic = "force-dynamic";

/**
 * Ayuda para la demostración: hay que quitarla antes de cualquier uso real.
 *
 * La lista está escrita aquí y no se lee de la base a propósito: esta página es
 * pública, y consultar las cuentas para pintarlas expondría todos los correos
 * del sistema. El nombre del rol sí sale del catálogo, para que no se
 * desincronice si alguno se renombra.
 */
const CUENTAS_DEMO: [string, ClaveRol][] = [
  ["admin@cernace.org", ROLES.ADMIN],
  ["direccion@cernace.org", ROLES.DIRECCION],
  ["trabajosocial@cernace.org", ROLES.TRABAJO_SOCIAL],
  ["terapeuta@cernace.org", ROLES.TERAPEUTA],
  ["padrino@cernace.org", ROLES.PADRINO],
  ["familia@cernace.org", ROLES.BENEFICIARIO],
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirigir?: string }>;
}) {
  const { redirigir } = await searchParams;
  if (await usuarioActual()) redirect("/inicio");

  // Solo se acepta una ruta interna, para no convertir el login en un
  // redireccionador abierto.
  const destino =
    redirigir && redirigir.startsWith("/") && !redirigir.startsWith("//")
      ? redirigir
      : "/inicio";

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>

      <header className="border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al sitio
          </Link>
        </div>
      </header>

      <main
        id="contenido"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          <p className="rotulo aparece text-brand-primary">CERNACE</p>
          <h1 className="filete aparece aparece-2 mt-3 font-heading text-3xl font-semibold tracking-tight text-ink">
            Acceso para personal, padrinos y familias
          </h1>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            Cada cuenta ve únicamente lo que su rol permite. Los accesos quedan
            registrados en la bitácora de auditoría.
          </p>

          <Tarjeta className="aparece aparece-3 mt-6 p-6">
            <FormularioLogin accion={iniciarSesion} redirigir={destino} />
          </Tarjeta>

          <Tarjeta className="mt-6 p-5">
            <h2 className="text-sm font-semibold text-ink">
              Cuentas de demostración
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Contraseña para todas: <code className="font-mono">cernace2026</code>
            </p>
            <table className="mt-3 w-full text-left text-xs">
              <caption className="visually-hidden">
                Cuentas de demostración disponibles y su rol
              </caption>
              <thead>
                <tr className="text-ink-soft">
                  <th scope="col" className="pb-1 font-semibold">
                    Correo
                  </th>
                  <th scope="col" className="pb-1 font-semibold">
                    Rol
                  </th>
                </tr>
              </thead>
              <tbody className="text-ink">
                {CUENTAS_DEMO.map(([correo, rol]) => (
                  <tr key={correo}>
                    <td className="py-0.5 font-mono">{correo}</td>
                    <td className="py-0.5">{nombreDeRol(rol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
        </div>
      </main>
    </div>
  );
}
