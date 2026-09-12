import type { ReactNode } from "react";
import {
  Building2,
  Clock,
  Globe,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Share2,
  Truck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Tarjeta } from "@/components/ui";

/* -------------------------------------------------------------------------
   Datos institucionales de contacto

   Son los del registro de AUPADIP/CERNACE ante el Ministerio de Salud
   Pública y Asistencia Social: no salen de la base de datos porque nadie los
   edita desde el panel —cambian cuando cambia el registro—, igual que el
   contenido de "Conócenos".
   ------------------------------------------------------------------------- */

export const CANALES = {
  web: "www.cernace.org.gt",
  facebook: "Rescatando Ángeles",
  facebookUrl: "https://www.facebook.com/RescatandoAngeles",
  telefono: "(502) 4689 0811",
  correos: ["administracion@cernace.org.gt", "rescatandoangeles@gmail.com"],
  horario: "Lunes a viernes, 8:00 a 16:30",
};

export const SEDES = [
  {
    titulo: "Dirección física",
    icono: MapPin,
    lineas: [
      "CERNACE AUPADIP",
      "Caserío San Pedro, Zona 0, Cuilco",
      "Huehuetenango, Guatemala",
    ],
  },
  {
    titulo: "Domicilio fiscal",
    icono: Building2,
    lineas: [
      "CERNACE AUPADIP",
      "7a. avenida 26-97, zona 1",
      "Colonia Nido del Gavilán, Mixco, Guatemala",
    ],
  },
];

/** Directorio de empleados AUPADIP 2026, en el orden del listado oficial. */
type Empleado = { nombre: string; puesto: string; correo: string; telefono: string };

const EQUIPO: { area: string; icono: LucideIcon; personas: Empleado[] }[] = [
  {
    area: "Atención clínica y terapéutica",
    icono: HeartPulse,
    personas: [
      {
        nombre: "Heber Abimael Hernández Hernández",
        puesto: "Médico y cirujano",
        correo: "hernandezabimael1991@gmail.com",
        telefono: "5186 5820",
      },
      {
        nombre: "Neyomy Gliceth De León Ramírez",
        puesto: "Enfermera I",
        correo: "glicetneyomy@gmail.com",
        telefono: "5161 0515",
      },
      {
        nombre: "Gianini Mario Héctor Morales Herrera",
        puesto: "Fisioterapista I",
        correo: "gianmario_cerguaci18@hotmail.com",
        telefono: "4487 4137",
      },
      {
        nombre: "Oscar Alexander Cifuentes Cano",
        puesto: "Fisioterapista II",
        correo: "alexand.1.5.14@gmail.com",
        telefono: "4958 9003",
      },
      {
        nombre: "Katia Celeste Rivas Morales",
        puesto: "Terapista ocupacional",
        correo: "katiarivas_15@hotmail.com",
        telefono: "4650 3724",
      },
      {
        nombre: "Mariela Elisa Roblero Pérez",
        puesto: "Terapista ocupacional",
        correo: "robleroperezeliza@gmail.com",
        telefono: "3010 5393",
      },
      {
        nombre: "Alejandra María De León Bautista",
        puesto: "Técnica en desarrollo psicomotriz I",
        correo: "maleleon18@gmail.com",
        telefono: "4828 8024",
      },
      {
        nombre: "Magdalena Elizabeth Hernández Yoc",
        puesto: "Técnica en desarrollo psicomotriz II",
        correo: "maeliher19@gmail.com",
        telefono: "5004 5705",
      },
      {
        nombre: "Suny Anely Chávez Gálvez",
        puesto: "Técnica en desarrollo psicomotriz III",
        correo: "sachgh82@gmail.com",
        telefono: "4984 3657",
      },
    ],
  },
  {
    area: "Coordinación y administración",
    icono: Wallet,
    personas: [
      {
        nombre: "Gudberto Salomón Gálvez Robledo",
        puesto: "Coordinador del proyecto",
        correo: "salgalvez@gmail.com",
        telefono: "3705 3813",
      },
      {
        nombre: "Yesenia Patricia Reyes Matías",
        puesto: "Contadora / administrativa",
        correo: "jessiita.2792@gmail.com",
        telefono: "5302 5006",
      },
    ],
  },
  {
    area: "Logística y mantenimiento",
    icono: Truck,
    personas: [
      {
        nombre: "Rony Fernando Méndez Cardona",
        puesto: "Piloto logística I",
        correo: "fernandomencar7@gmail.com",
        telefono: "3208 7076",
      },
      {
        nombre: "Roberto Carlos Reyes Matías",
        puesto: "Piloto logística II",
        correo: "krlosrys481@gmail.com",
        telefono: "3110 4636",
      },
      {
        nombre: "Ernesto Juárez Gonzales",
        puesto: "Logística y mantenimiento",
        correo: "ernestojuarezgon@gmail.com",
        telefono: "3333 1240",
      },
    ],
  },
];

/** Los enlaces `tel:` llevan el código de país; el texto se queda legible. */
const conCodigoPais = (telefono: string) =>
  `+502${telefono.replace(/\D/g, "")}`;

/* -------------------------------------------------------------------------
   Bloques de la página de contacto
   ------------------------------------------------------------------------- */

/** Tarjeta "Más sobre nosotros": los canales por los que se nos encuentra. */
export function TarjetaCanales() {
  return (
    <Tarjeta className="p-6" aria-labelledby="mas-sobre-nosotros">
      <p className="rotulo text-brand-primary">Más sobre nosotros</p>
      <h2
        id="mas-sobre-nosotros"
        className="mt-2 font-heading text-lg font-semibold text-ink"
      >
        Dónde encontrarnos
      </h2>

      <address className="mt-5 space-y-4 text-sm not-italic text-ink-soft">
        <Dato icono={Globe} titulo="Página web">
          <a
            href={`https://${CANALES.web}`}
            className="enlace-vivo text-brand-primary"
          >
            {CANALES.web}
          </a>
        </Dato>

        <Dato icono={Share2} titulo="Facebook">
          <a
            href={CANALES.facebookUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="enlace-vivo text-brand-primary"
          >
            {CANALES.facebook}
          </a>
        </Dato>

        <Dato icono={Phone} titulo="Teléfono">
          <a
            href={`tel:${conCodigoPais(CANALES.telefono)}`}
            className="hover:underline"
          >
            {CANALES.telefono}
          </a>
        </Dato>

        <Dato icono={Mail} titulo="Correo">
          {CANALES.correos.map((correo) => (
            <a
              key={correo}
              href={`mailto:${correo}`}
              className="block break-words hover:underline"
            >
              {correo}
            </a>
          ))}
        </Dato>

        {SEDES.map((sede) => (
          <Dato key={sede.titulo} icono={sede.icono} titulo={sede.titulo}>
            {sede.lineas.map((linea) => (
              <span key={linea} className="block">
                {linea}
              </span>
            ))}
          </Dato>
        ))}

        <Dato icono={Clock} titulo="Horario de atención">
          {CANALES.horario}
        </Dato>
      </address>
    </Tarjeta>
  );
}

/** Directorio del personal, por área de trabajo. */
export function SeccionDirectorio() {
  return (
    <section
      className="franja-clara border-y border-line"
      aria-labelledby="directorio-titulo"
    >
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="rotulo text-brand-primary">Nuestro equipo</p>
        <h2
          id="directorio-titulo"
          className="filete mt-3 font-heading text-2xl font-semibold text-ink sm:text-3xl"
        >
          Directorio de empleados 2026
        </h2>
        <p className="medida-lectura mt-3 text-ink-soft">
          El personal que atiende el centro, tal como figura en el directorio
          presentado ante el Ministerio de Salud Pública y Asistencia Social.
          Si tu consulta es sobre un área concreta, escribe directamente a quien
          la atiende.
        </p>

        <div className="mt-8 space-y-6">
          {EQUIPO.map((grupo) => (
            <Tarjeta key={grupo.area} className="revela p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
                <grupo.icono
                  aria-hidden="true"
                  className="size-5 text-brand-primary"
                />
                {grupo.area}
              </h3>

              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {grupo.personas.map((persona) => (
                  <li
                    key={persona.correo}
                    className="tarjeta-viva flex gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-sky text-brand-primary"
                    >
                      <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{persona.nombre}</p>
                      <p className="text-sm text-ink-soft">{persona.puesto}</p>
                      <p className="mt-2 text-sm">
                        <a
                          href={`mailto:${persona.correo}`}
                          className="break-words text-brand-primary hover:underline"
                        >
                          {persona.correo}
                        </a>
                      </p>
                      <p className="text-sm">
                        <a
                          href={`tel:${conCodigoPais(persona.telefono)}`}
                          className="text-ink-soft hover:underline"
                        >
                          {persona.telefono}
                        </a>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Pieza interna
   ------------------------------------------------------------------------- */

function Dato({
  icono: Icono,
  titulo,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icono
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-brand-primary"
      />
      <div className="min-w-0">
        <p className="font-semibold text-ink">{titulo}</p>
        {children}
      </div>
    </div>
  );
}
