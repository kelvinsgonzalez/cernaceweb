import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { Carrusel, type Lamina } from "@/components/carrusel";
import { SeccionConocenos, SeccionValores } from "@/components/conocenos";
import { CarruselHistorias } from "@/components/carrusel-historias";
import { FILTRO_ESPERAN_PADRINO } from "@/components/galeria-beneficiarios";

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
  // Los mismos que enseña /apadrina/todos, para que el botón no prometa más
  // de lo que hay en el listado.
  const esperan = await prisma.beneficiario.count({
    where: FILTRO_ESPERAN_PADRINO,
  });

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
                href="/inscripcion"
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

      {/* Historias de éxito, con la invitación a apadrinar. Sin historias
          publicadas la sección entera desaparece, botón incluido. */}
      <CarruselHistorias
        className="mx-auto max-w-6xl px-4 py-14 sm:py-20"
        llamada={
          <Tarjeta className="revela mt-8 bg-brand-sky p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="font-heading text-xl font-semibold text-ink">
                  Cada historia empieza con un padrino
                </h3>
                <p className="medida-lectura mt-2 text-ink-soft">
                  {esperan > 0
                    ? `Hoy ${esperan === 1 ? "hay un niño que espera" : `hay ${esperan} niños que esperan`} un padrino. Conócelos y elige a quién acompañar.`
                    : "Conoce a los niños que esperan un padrino y elige a quién acompañar."}
                </p>
              </div>
              <EnlaceBoton
                href="/apadrina/todos"
                className="px-6 py-3 text-base"
              >
                Ver a los niños sin padrino
              </EnlaceBoton>
            </div>
          </Tarjeta>
        }
      />

      {/* Valores */}
      <SeccionValores />
    </>
  );
}
