import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { PortadaBeneficiario } from "@/components/foto-beneficiario";
import { Carrusel, type Lamina } from "@/components/carrusel";
import { SeccionConocenos } from "@/components/conocenos";
import { calcularEdad } from "@/lib/fechas";
import { primerNombre, urlFotoBeneficiario } from "@/lib/utils";

// Sin esto el conteo del cierre quedaría congelado en el momento del build.
export const dynamic = "force-dynamic";

const LAMINAS: Lamina[] = [
  {
    src: "/carrusel/terapia-fisica.png",
    alt: "Un terapeuta atiende a un niño recostado en la camilla del área de terapia física.",
    pie: "Terapia física en el centro",
  },
  {
    src: "/carrusel/entrega-silla.png",
    alt: "Un técnico ajusta una silla de ruedas en el corredor de la casa de un beneficiario.",
    pie: "Entrega y ajuste de sillas de ruedas",
  },
  {
    src: "/carrusel/familias.jpg",
    alt: "Familias, beneficiarios y personal de CERNACE reunidos en el salón del centro.",
    pie: "Encuentro con las familias",
  },
  {
    src: "/carrusel/equipo.jpg",
    alt: "El equipo de CERNACE reunido en el vestíbulo del centro.",
    pie: "El equipo de CERNACE",
  },
];

export default async function LandingPage() {
  const [sinPadrino, programas, esperando] = await Promise.all([
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
    }),
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.beneficiario.findMany({
      where: {
        estado: "ACTIVO",
        // Las dos condiciones: la familia lo pidió y la administración lo autorizó.
        solicitaPatrocinio: true,
        publicadoEnGaleria: true,
        padrinazgos: { none: { activo: true } },
      },
      // La galería pública solo expone primer nombre, edad y programa.
      select: {
        id: true,
        nombres: true,
        fechaNacimiento: true,
        resumenPublico: true,
        fotoArchivo: true,
        programa: { select: { nombre: true, icono: true } },
      },
      take: 3,
      orderBy: { fechaIngreso: "asc" },
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section
        className="franja-tinta superficie-oscura relative overflow-hidden"
        aria-labelledby="hero-titulo"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1
              id="hero-titulo"
              className="max-w-[22ch] font-heading text-[2.2rem] leading-[1.1] font-semibold text-crema sm:text-[2.75rem]"
            >
              Centro de Educación y Rehabilitación para Niños y Adolescentes con
              Capacidades Especiales
            </h1>
            <p className="medida-lectura mt-6 text-lg text-crema/80">
              CERNACE atiende a niñas, niños y adolescentes con capacidades
              especiales: terapia, educación adaptada y apoyo a sus familias.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <EnlaceBoton
                href="/donar"
                className="bg-brand-yellow px-6 py-3 text-base text-brand-dark hover:bg-crema"
              >
                Donar
              </EnlaceBoton>
              <EnlaceBoton
                href="/apadrina"
                variante="contorno"
                className="border-crema/40 bg-transparent px-6 py-3 text-base text-crema hover:border-crema hover:bg-crema/10"
              >
                Apadrinar a un niño
              </EnlaceBoton>
              <EnlaceBoton
                href="/inscripcion/beneficiario"
                variante="suave"
                className="bg-transparent px-6 py-3 text-base text-crema/85 hover:bg-crema/10 hover:text-crema"
              >
                Inscribir a un niño
              </EnlaceBoton>
            </div>
          </div>

          {/* El carrusel va enmarcado en claro: su pie de foto es tinta
              oscura y sobre la franja no tendría contraste. */}
          <div className="rounded-[var(--radius-lg)] border border-crema/15 bg-surface/95 p-3 shadow-alta">
            <Carrusel laminas={LAMINAS} />
          </div>
        </div>
      </section>

      {/* Conócenos */}
      <SeccionConocenos />

      {/* Programas */}
      <section
        className="mx-auto max-w-6xl px-4 py-14 sm:py-20"
        aria-labelledby="programas-titulo"
      >
        <h2
          id="programas-titulo"
          className="font-heading text-3xl font-semibold text-ink sm:text-4xl"
        >
          Programas
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programas.map((programa) => (
            <li key={programa.id}>
              <Tarjeta className="h-full p-6">
                <span className="flex size-12 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
                  <IconoPrograma nombre={programa.icono} className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-ink">
                  {programa.nombre}
                </h3>
                <p className="medida-lectura mt-2 text-sm text-ink-soft">
                  {programa.descripcion}
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>

        {/* Puente hacia el formulario de inscripción, más abajo en esta misma página. */}
        <Tarjeta className="mt-10 bg-brand-sky p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">
                También queremos ayudarte
              </h3>
              <p className="medida-lectura mt-3 text-ink-soft">
                Ningún diagnóstico define hasta dónde puede llegar un niño. Si
                en tu familia hay alguien que necesita terapia, equipo adaptado
                o acompañamiento, aquí empieza el camino: cuéntanos su historia
                y damos el primer paso juntos.
              </p>
            </div>
            <EnlaceBoton
              href="/inscripcion/beneficiario"
              className="px-6 py-3 text-base"
            >
              Inscribir a un niño
            </EnlaceBoton>
          </div>
        </Tarjeta>
      </section>

      {/* Esperan padrino */}
      <section
        className="border-y border-line bg-surface py-14 sm:py-20"
        aria-labelledby="esperan-titulo"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="esperan-titulo"
                className="font-heading text-3xl font-semibold text-ink sm:text-4xl"
              >
                Beneficiarios que esperan padrino
              </h2>
              <p className="medida-lectura mt-3 text-ink-soft">
                Publicamos únicamente su primer nombre, su edad y su programa.
                El resto del expediente es confidencial.
              </p>
            </div>
            <EnlaceBoton href="/apadrina" variante="contorno">
              Ver a todos
            </EnlaceBoton>
          </div>

          {esperando.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              Ahora mismo todos los beneficiarios publicados tienen padrino
              asignado.
            </p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {esperando.map((nino) => {
                const nombre = primerNombre(nino.nombres);
                return (
                  <li key={nino.id}>
                    <Tarjeta className="flex h-full flex-col p-6">
                      <PortadaBeneficiario
                        nombre={nombre}
                        fotoUrl={urlFotoBeneficiario(nino.id, nino.fotoArchivo)}
                      />
                      <h3 className="mt-5 font-heading text-xl font-semibold text-ink">
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
                        className="mt-5 inline-flex text-sm font-semibold text-brand-primary underline underline-offset-4"
                      >
                        Ver su ficha
                        <span className="visually-hidden"> de {nombre}</span>
                      </Link>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section
        className="superficie-oscura franja-cierre"
        aria-labelledby="cta-titulo"
      >
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <h2
            id="cta-titulo"
            className="font-heading text-3xl font-semibold text-crema sm:text-4xl"
          >
            Hay {sinPadrino} {sinPadrino === 1 ? "niño" : "niños"} sin padrino
            asignado
          </h2>
          <p className="medida-lectura mx-auto mt-4 text-lg text-crema/80">
            El aporte mensual cubre sus terapias, su material adaptado y el
            transporte de su familia.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <EnlaceBoton
              href="/inscripcion/padrino"
              className="bg-brand-yellow px-6 py-3 text-base text-brand-dark hover:bg-crema"
            >
              Ser padrino
            </EnlaceBoton>
            <EnlaceBoton
              href="/donar"
              variante="contorno"
              className="border-crema/45 bg-transparent px-6 py-3 text-base text-crema hover:border-crema hover:bg-crema/10"
            >
              Hacer una donación
            </EnlaceBoton>
          </div>
        </div>
      </section>
    </>
  );
}
