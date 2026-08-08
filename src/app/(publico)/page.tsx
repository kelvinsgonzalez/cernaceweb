import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  HandHeart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { calcularEdad } from "@/lib/fechas";
import { primerNombre } from "@/lib/utils";

// Las cifras del hero salen de la base: sin esto Next prerenderiza la página
// y los números quedan congelados en el momento del build.
export const dynamic = "force-dynamic";

const SELLOS = [
  {
    icono: ShieldCheck,
    titulo: "Expedientes resguardados",
    texto: "Acceso por rol y bitácora de cada consulta.",
  },
  {
    icono: Eye,
    titulo: "Avances verificables",
    texto: "El padrino consulta el progreso de su beneficiado.",
  },
  {
    icono: ClipboardCheck,
    titulo: "Cuentas claras",
    texto: "Cada donación queda registrada con su comprobante.",
  },
];

const PASOS = [
  {
    titulo: "Elige a quién acompañar",
    texto:
      "En la galería aparecen los beneficiarios que todavía no tienen apoyo asignado, con su edad y su programa.",
  },
  {
    titulo: "Formaliza tu apadrinamiento",
    texto:
      "Llenas el formulario de inscripción, defines tu aporte mensual y el equipo confirma la asignación.",
  },
  {
    titulo: "Sigue su progreso",
    texto:
      "Con tu acceso al portal ves los avances que el personal marca como visibles para el padrino.",
  },
];

export default async function LandingPage() {
  const [
    totalBeneficiarios,
    programasActivos,
    totalPadrinos,
    sinPadrino,
    programas,
    esperando,
    historias,
  ] = await Promise.all([
    prisma.beneficiario.count({ where: { estado: "ACTIVO" } }),
    prisma.programa.count({ where: { activo: true } }),
    prisma.padrino.count({ where: { activo: true } }),
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
    }),
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { beneficiarios: true } } },
    }),
    prisma.beneficiario.findMany({
      where: {
        estado: "ACTIVO",
        publicadoEnGaleria: true,
        padrinazgos: { none: { activo: true } },
      },
      // La galería pública solo expone primer nombre, edad y programa.
      select: {
        id: true,
        nombres: true,
        fechaNacimiento: true,
        resumenPublico: true,
        programa: { select: { nombre: true, icono: true } },
      },
      take: 3,
      orderBy: { fechaIngreso: "asc" },
    }),
    prisma.story.findMany({
      where: { estado: "PUBLICADO" },
      orderBy: { publicadaEn: "desc" },
      take: 3,
    }),
  ]);

  const cifras = [
    { etiqueta: "Beneficiarios activos", valor: totalBeneficiarios },
    { etiqueta: "Programas activos", valor: programasActivos },
    { etiqueta: "Padrinos", valor: totalPadrinos },
    { etiqueta: "Esperan padrino", valor: sinPadrino },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-sky" aria-labelledby="hero-titulo">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand-dark">
              <Sparkles aria-hidden="true" className="size-4" />
              Chimaltenango, Guatemala
            </p>
            <h1
              id="hero-titulo"
              className="mt-5 font-heading text-4xl font-bold text-brand-dark sm:text-5xl"
            >
              Cada niño avanza a su ritmo. Nuestro trabajo es que nadie se quede
              sin acompañamiento.
            </h1>
            <p className="medida-lectura mt-5 text-lg text-ink">
              CERNACE atiende a niñas, niños y adolescentes con capacidades
              especiales con terapia, educación adaptada y apoyo a sus familias.
              Cada expediente se lleva al día y cada avance se registra.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <EnlaceBoton href="/donar" className="px-6 py-3 text-base">
                Donar ahora
              </EnlaceBoton>
              <EnlaceBoton
                href="/apadrina"
                variante="contorno"
                className="px-6 py-3 text-base"
              >
                Apadrina a un niño
              </EnlaceBoton>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {SELLOS.map((sello) => (
                <li key={sello.titulo} className="flex gap-3">
                  <sello.icono
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-brand-green"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {sello.titulo}
                    </span>
                    <span className="block text-sm text-ink-soft">{sello.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cifras.map((cifra) => (
              <Tarjeta key={cifra.etiqueta} className="p-6">
                <p className="font-heading text-4xl font-bold text-brand-primary">
                  {cifra.valor}
                </p>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  {cifra.etiqueta}
                </p>
              </Tarjeta>
            ))}
          </div>
        </div>
      </section>

      {/* Programas */}
      <section
        className="mx-auto max-w-6xl px-4 py-16"
        aria-labelledby="programas-titulo"
      >
        <h2
          id="programas-titulo"
          className="font-heading text-3xl font-bold text-ink"
        >
          Nuestros programas
        </h2>
        <p className="medida-lectura mt-3 text-ink-soft">
          Cada beneficiario entra a un programa según su evaluación inicial y
          puede recibir apoyo de varias áreas a la vez.
        </p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programas.map((programa) => (
            <li key={programa.id}>
              <Tarjeta className="h-full p-6">
                <span className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
                  <IconoPrograma nombre={programa.icono} className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-ink">
                  {programa.nombre}
                </h3>
                <p className="medida-lectura mt-2 text-sm text-ink-soft">
                  {programa.descripcion}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-dark">
                  {programa._count.beneficiarios}{" "}
                  {programa._count.beneficiarios === 1
                    ? "beneficiario inscrito"
                    : "beneficiarios inscritos"}
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      </section>

      {/* Esperan padrino */}
      <section className="bg-surface py-16" aria-labelledby="esperan-titulo">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="esperan-titulo"
                className="font-heading text-3xl font-bold text-ink"
              >
                Ellos esperan un padrino
              </h2>
              <p className="medida-lectura mt-3 text-ink-soft">
                Publicamos únicamente su primer nombre, su edad y su programa.
                El resto del expediente es confidencial.
              </p>
            </div>
            <EnlaceBoton href="/apadrina" variante="contorno">
              Ver a todos
              <ArrowRight aria-hidden="true" className="size-4" />
            </EnlaceBoton>
          </div>

          {esperando.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              Ahora mismo todos los beneficiarios publicados tienen padrino
              asignado. ¡Gracias!
            </p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {esperando.map((nino) => {
                const nombre = primerNombre(nino.nombres);
                return (
                  <li key={nino.id}>
                    <Tarjeta className="flex h-full flex-col p-6">
                      <span className="flex size-14 items-center justify-center rounded-full bg-brand-yellow font-heading text-xl font-bold text-brand-dark">
                        {nombre[0]}
                      </span>
                      <h3 className="mt-4 font-heading text-lg font-semibold text-ink">
                        {nombre}, {calcularEdad(nino.fechaNacimiento)} años
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
                        <IconoPrograma
                          nombre={nino.programa.icono}
                          className="size-4"
                        />
                        {nino.programa.nombre}
                      </p>
                      {nino.resumenPublico ? (
                        <p className="medida-lectura mt-3 flex-1 text-sm text-ink-soft">
                          {nino.resumenPublico}
                        </p>
                      ) : null}
                      <Link
                        href={`/apadrina/${nino.id}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
                      >
                        Conocer su historia
                        <span className="visually-hidden">de {nombre}</span>
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section
        className="mx-auto max-w-6xl px-4 py-16"
        aria-labelledby="pasos-titulo"
      >
        <h2 id="pasos-titulo" className="font-heading text-3xl font-bold text-ink">
          Cómo funciona el apadrinamiento
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo}>
              <Tarjeta className="h-full p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary font-heading text-lg font-bold text-white">
                  {indice + 1}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-ink">
                  {paso.titulo}
                </h3>
                <p className="medida-lectura mt-2 text-sm text-ink-soft">
                  {paso.texto}
                </p>
              </Tarjeta>
            </li>
          ))}
        </ol>
      </section>

      {/* Historias */}
      <section className="bg-surface py-16" aria-labelledby="historias-titulo">
        <div className="mx-auto max-w-6xl px-4">
          <h2
            id="historias-titulo"
            className="font-heading text-3xl font-bold text-ink"
          >
            Historias de avance
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {historias.map((historia) => (
              <li key={historia.id}>
                <Tarjeta className="h-full p-6">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-green">
                    <HandHeart aria-hidden="true" className="size-4" />
                    {historia.programa ?? "CERNACE"}
                  </p>
                  <h3 className="mt-3 font-heading text-lg font-semibold text-ink">
                    {historia.titulo}
                  </h3>
                  <p className="medida-lectura mt-2 text-sm text-ink-soft">
                    {historia.resumen}
                  </p>
                </Tarjeta>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section
        className="superficie-oscura bg-brand-coral"
        aria-labelledby="cta-titulo"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h2
            id="cta-titulo"
            className="font-heading text-3xl font-bold text-brand-dark"
          >
            Hay {sinPadrino} {sinPadrino === 1 ? "niño" : "niños"} esperando
            acompañamiento
          </h2>
          <p className="medida-lectura mx-auto mt-3 text-brand-dark/85">
            Un aporte mensual sostiene sus terapias, su material adaptado y el
            transporte de su familia.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <EnlaceBoton
              href="/inscripcion/padrino"
              className="bg-brand-dark px-6 py-3 text-base hover:bg-ink"
            >
              <Users aria-hidden="true" className="size-4" />
              Quiero ser padrino
            </EnlaceBoton>
            <EnlaceBoton
              href="/donar"
              variante="contorno"
              className="border-brand-dark px-6 py-3 text-base text-brand-dark"
            >
              Hacer una donación
            </EnlaceBoton>
          </div>
        </div>
      </section>
    </>
  );
}
