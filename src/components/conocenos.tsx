import Image from "next/image";
import {
  Accessibility,
  BadgeCheck,
  Compass,
  Eye,
  HandHeart,
  Handshake,
  Heart,
  MapPin,
  ScrollText,
  Sparkles,
  Sun,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { Pestanas, type Pestana } from "@/components/pestanas";

/* -------------------------------------------------------------------------
   Contenido institucional

   Es el texto oficial de AUPADIP y CERNACE (acta de constitución, misión,
   visión y listado de junta directiva). No viene de la base de datos porque
   no lo edita nadie desde el panel: cambia cuando cambia el acta.
   ------------------------------------------------------------------------- */

const IDENTIDAD: Pestana[] = [
  {
    id: "mision",
    etiqueta: "Misión",
    icono: <Target aria-hidden="true" className="size-4" />,
    contenido: (
      <BloqueIdentidad
        titulo="Nuestra misión"
        texto="Brindar educación especial y rehabilitación a niños y adolescentes con discapacidad, promoviendo el entrenamiento independiente para lograr la inclusión y la participación integral en la sociedad, así como orientación a sus familias."
      />
    ),
  },
  {
    id: "vision",
    etiqueta: "Visión",
    icono: <Eye aria-hidden="true" className="size-4" />,
    contenido: (
      <BloqueIdentidad
        titulo="Nuestra visión"
        texto="Ser intermediarios de la solidaridad a nivel nacional e internacional para apoyar a la población con discapacidad, priorizando a los niños y adolescentes del municipio de Cuilco y lugares aledaños."
      />
    ),
  },
  {
    id: "funcion",
    etiqueta: "Función",
    icono: <Compass aria-hidden="true" className="size-4" />,
    contenido: (
      <BloqueIdentidad
        titulo="Nuestra función"
        texto="Atender en salud primaria básica a personas con discapacidad y con discapacidad transitoria: atención médica, rehabilitación física, terapia ocupacional, estimulación temprana y psicomotriz, y visitas domiciliares de Rehabilitación Basada en la Comunidad (RBC)."
        lista={[
          "Promovemos la inclusión social, laboral y familiar de los beneficiarios.",
          "Gestionamos medicamentos, insumos y ayudas técnicas.",
          "Coordinamos acciones con instituciones públicas y privadas.",
          "Capacitamos a las familias y acompañamos su proceso en casa.",
        ]}
      />
    ),
  },
];

/** Condiciones que atiende el centro, tal como figuran en el registro clínico. */
const POBLACION = [
  "Parálisis cerebral",
  "Hemiplejia",
  "Distrofias musculares",
  "Hidrocefalia",
  "Espina bífida",
  "Mielomeningocele",
  "Accidentes cerebrovasculares",
  "Síndrome de Down",
  "Síndrome de Crouzon",
  "Trastorno del Espectro Autista (TEA)",
  "Déficit de atención e hiperactividad (TDAH)",
];

const HITOS = [
  {
    anio: "2008",
    fecha: "23 de septiembre",
    titulo: "Nace AUPADIP",
    texto:
      "Se funda en la ciudad de Guatemala la Asociación Unidos para Ayudar al Desarrollo Integral de los Pueblos, como respuesta a las familias de Cuilco y San Ildefonso Ixtahuacán que no tenían dónde atender a sus hijos.",
  },
  {
    anio: "2008",
    fecha: "El llamado",
    titulo: "Un padre y una comunidad",
    texto:
      "El Rev. Isaías Gálvez, de la Fraternidad Misionera de María y originario del lugar, escucha a los padres de niños con discapacidad y convoca a personas altruistas a unirse a la causa.",
  },
  {
    anio: "2012",
    fecha: "2 de julio",
    titulo: "Abre CERNACE",
    texto:
      "Se inaugura en Cuilco, Huehuetenango, el Centro Educativo y de Rehabilitación para Niños y Adolescentes con Capacidades Especiales: el primer proyecto de la asociación.",
  },
  {
    anio: "Hoy",
    fecha: "Cuilco y alrededores",
    titulo: "Un equipo interdisciplinario",
    texto:
      "Médicos, fisioterapeutas, terapeutas ocupacionales y promotoras comunitarias atienden el centro y visitan a las familias en cuatro regiones sectorizadas del municipio.",
  },
];

const VALORES: { icono: LucideIcon; nombre: string; texto: string }[] = [
  {
    icono: HandHeart,
    nombre: "Servicio",
    texto: "Prestar ayuda y apoyo a los demás, buscando su bienestar y satisfacción.",
  },
  {
    icono: Handshake,
    nombre: "Solidaridad",
    texto: "Apoyo y unión con los demás, especialmente en momentos de necesidad o dificultad.",
  },
  {
    icono: Heart,
    nombre: "Empatía",
    texto: "Comprender y compartir los sentimientos y las emociones de los demás.",
  },
  {
    icono: Sun,
    nombre: "Esperanza",
    texto: "Creer en un futuro mejor que inspira a los demás a seguir adelante.",
  },
  {
    icono: Sparkles,
    nombre: "Compasión",
    texto: "Respeto y voluntad activa de aliviar el sufrimiento de otra persona.",
  },
];

/* Listado vigente ante el Ministerio de Salud Pública y Asistencia Social.
   Se publican nombre y cargo: el DPI y el NIT del acta no salen del expediente. */
const JUNTA_DIRECTIVA = [
  { nombre: "Daniel Leal Salazar", cargo: "Presidente y representante legal" },
  { nombre: "Vilmer Noel Herrera De León", cargo: "Vicepresidente" },
  { nombre: "Rolendio Hermocindo Gil Pereira", cargo: "Secretario" },
  { nombre: "Noé Yovany Gálvez Robledo", cargo: "Tesorero" },
  { nombre: "Antonio Velásquez Morales", cargo: "Vocal I" },
  { nombre: "Julio Rodolfo Divas Navarro", cargo: "Vocal II" },
];

const COMITE_FISCALIZACION = [
  { nombre: "Heidy Maridalia Rodríguez Carbajal", cargo: "Presidenta" },
  { nombre: "Isaías Osnibal Gálvez Robledo", cargo: "Vicepresidente" },
  { nombre: "Amarildo Leví Méndez Vásquez", cargo: "Secretario" },
  { nombre: "Ángela Marleny Gálvez Roblero", cargo: "Tesorera" },
];

/* -------------------------------------------------------------------------
   Sección
   ------------------------------------------------------------------------- */

export function SeccionConocenos() {
  return (
    <section id="conocenos" aria-labelledby="conocenos-titulo">
      {/* 1. Quiénes somos ------------------------------------------------ */}
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="revela">
          <p className="rotulo text-brand-primary">Conócenos</p>
          <h2
            id="conocenos-titulo"
            className="filete mt-3 font-heading text-3xl font-semibold text-ink sm:text-4xl"
          >
            Quiénes somos
          </h2>
          <p className="medida-lectura mt-4 text-lg text-ink-soft">
            Somos la Asociación Unidos para Ayudar al Desarrollo Integral de los
            Pueblos (AUPADIP), un equipo interdisciplinario que eligió trabajar
            en favor de las personas con discapacidad de Cuilco, San Ildefonso
            Ixtahuacán y lugares aledaños.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="revela space-y-5">
            <Tarjeta className="tarjeta-viva p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
                <MapPin aria-hidden="true" className="size-5 text-brand-primary" />
                ¿Por qué en Cuilco?
              </h3>
              <p className="medida-lectura mt-3 text-ink-soft">
                Dos de los miembros fundadores son originarios de Cuilco y saben
                lo que es criar a un hijo con discapacidad. En el municipio había
                muchos casos y ningún centro que ofreciera atención
                especializada. Por eso, el 2 de julio de 2012, se inauguró
                CERNACE con programas de educación especial, rehabilitación
                física, terapia ocupacional, atención médica y formación para las
                familias.
              </p>
            </Tarjeta>

            <Tarjeta className="tarjeta-viva bg-brand-sky p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
                <ScrollText aria-hidden="true" className="size-5 text-brand-primary" />
                Personería jurídica
              </h3>
              <p className="medida-lectura mt-3 text-sm text-ink-soft">
                AUPADIP fue constituida el 23 de septiembre de 2008 en la ciudad
                de Guatemala e inscrita en la partida 18666, folio 18666 del
                libro 1 del Registro Electrónico de Personas Jurídicas, ante el
                abogado Marco Antonio Aguilar Palma.
              </p>
            </Tarjeta>
          </div>

          {/* La foto del equipo es de grupo: `cover` recortaría a alguien, así
              que se enmarca completa sobre el tinte azul. */}
          <figure className="revela overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-3 shadow-alta">
            <Image
              src="/carrusel/equipo.jpg"
              alt="El equipo de CERNACE reunido frente al centro, junto al Rev. Isaías Gálvez."
              width={1600}
              height={1066}
              sizes="(min-width: 1024px) 34rem, 100vw"
              className="w-full rounded-[var(--radius-md)] bg-brand-sky object-contain"
            />
            <figcaption className="px-1 pt-3 pb-1 text-sm text-ink-soft">
              El equipo que atiende el centro: médicos, fisioterapeutas,
              terapeutas y promotoras comunitarias.
            </figcaption>
          </figure>
        </div>

        {/* 2. Misión, visión y función ----------------------------------- */}
        <Pestanas
          className="revela mt-14"
          etiqueta="Misión, visión y función de la asociación"
          pestanas={IDENTIDAD}
        />

        {/* 3. A quiénes atendemos ---------------------------------------- */}
        <Tarjeta className="revela mt-14 p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <Accessibility aria-hidden="true" className="size-5 text-brand-primary" />
            A quiénes atendemos
          </h3>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            Niñas, niños, adolescentes y adultos con discapacidad permanente o
            transitoria. Estas son las condiciones que atendemos con más
            frecuencia:
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {POBLACION.map((condicion) => (
              <li
                key={condicion}
                className="rounded-full border border-line bg-canvas px-3.5 py-1.5 text-sm font-medium text-ink-soft"
              >
                {condicion}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      {/* 4. Reseña histórica -------------------------------------------- */}
      <div className="franja-clara border-y border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="revela">
            <p className="rotulo text-brand-primary">Reseña histórica</p>
            <h3 className="filete mt-3 font-heading text-2xl font-semibold text-ink sm:text-3xl">
              Cómo empezó todo
            </h3>
          </div>

          {/* Los hitos van pegados unos a otros (sin `gap`) para que los bordes
              de cada uno formen una sola línea de tiempo continua. */}
          <ol className="mt-10 grid md:grid-cols-4">
            {HITOS.map((hito) => (
              <li
                key={hito.titulo}
                className="revela relative border-l border-brand-primary/30 pb-8 pl-6 last:pb-0 md:border-l-0 md:border-t md:pt-8 md:pr-8 md:pb-0 md:pl-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[7px] size-3.5 rounded-full border-2 border-brand-primary bg-brand-sky md:top-[-7px] md:left-0"
                />
                <p className="font-heading text-2xl font-semibold text-brand-primary">
                  {hito.anio}
                </p>
                <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                  {hito.fecha}
                </p>
                <h4 className="mt-3 font-heading text-lg font-semibold text-ink">
                  {hito.titulo}
                </h4>
                <p className="mt-2 text-sm text-ink-soft">{hito.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 5. Valores y organización --------------------------------------- */}
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="revela">
          <p className="rotulo text-brand-primary">Nuestros valores</p>
          <h3 className="filete mt-3 font-heading text-2xl font-semibold text-ink sm:text-3xl">
            Lo que sostiene el trabajo diario
          </h3>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VALORES.map(({ icono: Icono, nombre, texto }) => (
            <li key={nombre} className="revela">
              <Tarjeta className="tarjeta-viva h-full p-5">
                <span className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
                  <Icono aria-hidden="true" className="size-5" />
                </span>
                <h4 className="mt-4 font-heading text-lg font-semibold text-ink">
                  {nombre}
                </h4>
                <p className="mt-2 text-sm text-ink-soft">{texto}</p>
              </Tarjeta>
            </li>
          ))}
        </ul>

        <div className="revela mt-14">
          <p className="rotulo text-brand-primary">Cómo nos organizamos</p>
          <h3 className="filete mt-3 font-heading text-2xl font-semibold text-ink sm:text-3xl">
            Junta directiva 2026
          </h3>
          <p className="medida-lectura mt-3 text-ink-soft">
            La asamblea general elige cada año a la junta directiva y al comité
            de fiscalización, y el listado se actualiza ante el Ministerio de
            Salud Pública y Asistencia Social.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ListaCargos
            titulo="Junta directiva"
            icono={UsersRound}
            personas={JUNTA_DIRECTIVA}
          />
          <ListaCargos
            titulo="Comité de fiscalización"
            icono={BadgeCheck}
            personas={COMITE_FISCALIZACION}
          />
        </div>

        <Tarjeta className="revela mt-5 bg-brand-sky p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h4 className="font-heading text-xl font-semibold text-ink">
                ¿Quieres conocernos de cerca?
              </h4>
              <p className="medida-lectura mt-2 text-ink-soft">
                La coordinación general está a cargo del Lic. Gudberto Salomón
                Gálvez Robledo. Escríbenos para visitar el centro, ofrecer tu
                tiempo o pedir información sobre los programas.
              </p>
            </div>
            <EnlaceBoton href="/contacto" className="px-6 py-3 text-base">
              Contáctanos
            </EnlaceBoton>
          </div>
        </Tarjeta>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Piezas internas
   ------------------------------------------------------------------------- */

function BloqueIdentidad({
  titulo,
  texto,
  lista,
}: {
  titulo: string;
  texto: string;
  lista?: string[];
}) {
  return (
    <Tarjeta className="p-6 sm:p-8">
      <h3 className="font-heading text-2xl font-semibold text-ink">{titulo}</h3>
      <p className="medida-lectura mt-3 text-lg text-ink-soft">{texto}</p>
      {lista ? (
        <ul className="medida-lectura mt-5 grid gap-2 sm:grid-cols-2">
          {lista.map((punto) => (
            <li key={punto} className="flex gap-2 text-sm text-ink-soft">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-primary"
              />
              {punto}
            </li>
          ))}
        </ul>
      ) : null}
    </Tarjeta>
  );
}

function ListaCargos({
  titulo,
  icono: Icono,
  personas,
}: {
  titulo: string;
  icono: LucideIcon;
  personas: { nombre: string; cargo: string }[];
}) {
  return (
    <Tarjeta className="revela tarjeta-viva h-full p-6 sm:p-8">
      <h4 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
        <Icono aria-hidden="true" className="size-5 text-brand-primary" />
        {titulo}
      </h4>
      <ul className="mt-5 divide-y divide-line">
        {personas.map((persona) => (
          <li key={persona.nombre} className="flex items-center gap-3 py-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-sky text-sm font-semibold text-brand-primary"
            >
              {inicialesNombre(persona.nombre)}
            </span>
            <div>
              <p className="font-medium text-ink">{persona.nombre}</p>
              <p className="text-sm text-ink-soft">{persona.cargo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

/** Primera letra del nombre y del primer apellido, para el círculo de la lista. */
function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase();
}
