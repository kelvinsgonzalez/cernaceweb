import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { usuarioActual } from "@/lib/sesion";
import { nombreDeRol } from "@/lib/rbac";
import { CerrarSesion } from "@/components/cerrar-sesion";

export const metadata: Metadata = {
  title: "Sin acceso",
};

export const dynamic = "force-dynamic";

export default async function SinAccesoPage() {
  const usuario = await usuarioActual();
  const roles = usuario?.roles.map(nombreDeRol).join(", ") ?? "sin rol";

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>
      <main
        id="contenido"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-12"
      >
        <Tarjeta className="w-full max-w-lg p-8">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-bad-bg text-bad-fg"
          >
            <Lock className="size-6" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold text-ink">
            No tienes acceso a esta sección
          </h1>
          <p className="medida-lectura mt-3 text-ink-soft">
            {usuario
              ? `Tu cuenta (${usuario.email}) tiene el rol de ${roles}, que no incluye el permiso necesario para esta pantalla. Si crees que es un error, pide al administrador que revise tus permisos.`
              : "Necesitas iniciar sesión para continuar."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {usuario ? (
              <>
                <EnlaceBoton href="/inicio">Ir a mi inicio</EnlaceBoton>
                <CerrarSesion variante="contorno" />
              </>
            ) : (
              <EnlaceBoton href="/login">Iniciar sesión</EnlaceBoton>
            )}
            <EnlaceBoton href="/" variante="suave">
              Volver al sitio público
            </EnlaceBoton>
          </div>
        </Tarjeta>
      </main>
    </div>
  );
}
