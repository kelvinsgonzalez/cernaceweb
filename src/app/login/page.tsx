import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import { Logo } from "@/components/publico";
import { usuarioActual } from "@/lib/sesion";
import { FormularioLogin } from "./formulario";
import { iniciarSesion } from "./acciones";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export const dynamic = "force-dynamic";

const CUENTAS_DEMO = [
  ["admin@cernace.org", "Administrador"],
  ["direccion@cernace.org", "Dirección"],
  ["trabajosocial@cernace.org", "Trabajo social"],
  ["terapeuta@cernace.org", "Terapeuta"],
  ["padrino@cernace.org", "Padrino"],
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

      <header className="border-b border-line bg-surface">
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
          <h1 className="font-heading text-3xl font-bold text-ink">
            Acceso para personal y padrinos
          </h1>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            Cada cuenta ve únicamente lo que su rol permite. Los accesos quedan
            registrados en la bitácora de auditoría.
          </p>

          <Tarjeta className="mt-6 p-6">
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
                    <td className="py-0.5">{rol}</td>
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
