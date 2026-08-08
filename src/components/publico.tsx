import Link from "next/link";
import { LogIn, Mail, Phone, Smile } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton } from "@/components/ui";

const NAVEGACION = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/apadrina", etiqueta: "Apadrina" },
  { href: "/inscripcion/beneficiario", etiqueta: "Inscripción" },
  { href: "/donar", etiqueta: "Donar" },
  { href: "/contacto", etiqueta: "Contacto" },
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

export function Logo({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-dark"
      >
        <Smile className="size-6" />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-heading text-xl font-bold ${oscuro ? "text-white" : "text-brand-dark"}`}
        >
          CERNACE
        </span>
        <span
          className={`block text-xs ${oscuro ? "text-white/70" : "text-ink-soft"}`}
        >
          Educación y rehabilitación
        </span>
      </span>
    </Link>
  );
}

export async function CabeceraPublica() {
  const contacto = await leerContacto();

  return (
    <>
      <div className="superficie-oscura bg-brand-dark text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <a
              href={`tel:${contacto.telefono.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <Phone aria-hidden="true" className="size-4" />
              {contacto.telefono}
            </a>
            <a
              href={`mailto:${contacto.email}`}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <Mail aria-hidden="true" className="size-4" />
              {contacto.email}
            </a>
          </div>
          <Link href="/login" className="font-medium hover:underline">
            Acceso para personal y padrinos
          </Link>
        </div>
      </div>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Logo />
          <nav aria-label="Navegación principal">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
              {NAVEGACION.map((enlace) => (
                <li key={enlace.href}>
                  <Link href={enlace.href} className="text-ink hover:text-brand-primary">
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
    <footer className="superficie-oscura mt-16 bg-brand-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo oscuro />
          <p className="medida-lectura mt-4 text-sm text-white/75">
            {contacto.nombreCompleto}. Chimaltenango, Guatemala.
          </p>
        </div>

        <nav aria-labelledby="pie-participar">
          <h2 id="pie-participar" className="font-heading text-base font-semibold">
            Participa
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
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
          <h2 className="font-heading text-base font-semibold">Contacto</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-white/80">
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

      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60">
          © {new Date().getFullYear()} CERNACE. Plataforma desarrollada como
          proyecto de graduación. Los datos mostrados son de demostración.
        </p>
      </div>
    </footer>
  );
}
