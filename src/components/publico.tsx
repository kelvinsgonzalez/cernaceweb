import Link from "next/link";
import { LogIn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton } from "@/components/ui";
import { Logo } from "@/components/logo";
import { MenuFlotante } from "@/components/menu-flotante";
import { CerrarSesion } from "@/components/cerrar-sesion";
import { usuarioActual } from "@/lib/sesion";
import { modulosVisibles } from "@/lib/navegacion";

const NAVEGACION = [
  { href: "/", etiqueta: "Inicio", icono: "House" },
  { href: "/apadrina", etiqueta: "Apadrina", icono: "HeartHandshake" },
  {
    href: "/inscripcion/beneficiario",
    etiqueta: "Inscripción",
    icono: "ClipboardList",
  },
  { href: "/donar", etiqueta: "Donar", icono: "HandCoins" },
  { href: "/contacto", etiqueta: "Contacto", icono: "Mail" },
];

export async function leerContacto() {
  const filas = await prisma.setting.findMany({
    where: { grupo: { in: ["contacto", "general"] } },
  });
  const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  return {
    telefono: mapa["contacto.telefono"] ?? "",
    email: mapa["contacto.email"] ?? "",
    direccion: mapa["contacto.direccion"] ?? "",
    nombreCompleto: mapa["organizacion.nombreCompleto"] ?? "CERNACE",
  };
}

export async function CabeceraPublica() {
  // Si hay sesión, el menú de móvil añade los módulos de esa cuenta: quien
  // llega al sitio público ya conectado no tiene que buscar la puerta de vuelta
  // a su panel, a su portal o a su expediente.
  const usuario = await usuarioActual();
  const modulos = [
    ...NAVEGACION.map((enlace) => ({ ...enlace, grupo: "Sitio", pendientes: 0 })),
    ...modulosVisibles(usuario?.permisos ?? []),
  ];

  return (
    <>
      <MenuFlotante
        titulo="CERNACE"
        subtitulo={usuario ? usuario.nombre : undefined}
        modulos={modulos}
        identidad={
          usuario ? { nombre: usuario.nombre, detalle: usuario.email } : undefined
        }
        pie={
          usuario ? (
            <CerrarSesion className="ml-auto" />
          ) : (
            <>
              <EnlaceBoton href="/login" variante="contorno">
                <LogIn aria-hidden="true" className="size-4" />
                Iniciar sesión
              </EnlaceBoton>
              <EnlaceBoton href="/donar">Donar ahora</EnlaceBoton>
            </>
          )
        }
      />

      {/* La cabecera completa es de pantalla ancha: en un teléfono la
          sustituye la barra flotante. */}
      <header className="z-40 hidden border-b border-line bg-surface/85 backdrop-blur-md lg:sticky lg:top-0 lg:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Logo />
          <nav aria-label="Navegación principal">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
              {NAVEGACION.map((enlace) => (
                <li key={enlace.href}>
                  <Link
                    href={enlace.href}
                    className="enlace-vivo text-ink transition-colors duration-200 hover:text-brand-primary"
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <EnlaceBoton href="/login" variante="contorno">
              <LogIn aria-hidden="true" className="size-4" />
              Iniciar sesión
            </EnlaceBoton>
            <EnlaceBoton href="/donar">Donar ahora</EnlaceBoton>
          </div>
        </div>
      </header>
    </>
  );
}

export async function PiePublico() {
  const contacto = await leerContacto();

  return (
    <footer className="superficie-oscura franja-tinta border-t border-crema/12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo oscuro />
          <p className="medida-lectura mt-4 text-sm text-crema/75">
            {contacto.nombreCompleto}. Chimaltenango, Guatemala.
          </p>
        </div>

        <nav aria-labelledby="pie-participar">
          <h2 id="pie-participar" className="rotulo text-brand-yellow">
            Participa
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-crema/80">
            <li>
              <Link href="/apadrina" className="hover:underline">
                Apadrina a un niño
              </Link>
            </li>
            <li>
              <Link href="/donar" className="hover:underline">
                Haz una donación
              </Link>
            </li>
            <li>
              <Link href="/inscripcion/padrino" className="hover:underline">
                Inscríbete como padrino
              </Link>
            </li>
            <li>
              <Link href="/inscripcion/beneficiario" className="hover:underline">
                Inscribe a un beneficiario
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:underline">
                Acceso para personal y padrinos
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="rotulo text-brand-yellow">Contacto</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-crema/80">
            <p>{contacto.direccion}</p>
            <p>
              <a href={`tel:${contacto.telefono.replace(/\s/g, "")}`} className="hover:underline">
                {contacto.telefono}
              </a>
            </p>
            <p>
              <a href={`mailto:${contacto.email}`} className="hover:underline">
                {contacto.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-crema/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-crema/55">
          © {new Date().getFullYear()} CERNACE. Plataforma desarrollada como
          proyecto de graduación. Los datos mostrados son de demostración.
        </p>
      </div>
    </footer>
  );
}
