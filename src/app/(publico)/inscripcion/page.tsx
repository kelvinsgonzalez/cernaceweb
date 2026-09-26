import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";

export const metadata: Metadata = {
  title: "Inscripción",
  description:
    "Los programas de CERNACE y cómo solicitar el ingreso de un niño o adolescente.",
};

// Sin esto los programas quedarían congelados en el momento del build.
export const dynamic = "force-dynamic";

/**
 * La antesala de la inscripción: primero los programas, para que la familia
 * sepa qué ofrece el centro, y después la invitación a inscribir. El
 * formulario como tal vive en /inscripcion/beneficiario.
 */
export default async function InscripcionPage() {
  const programas = await prisma.programa.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Inscripción
          </h1>
          <p className="medida-lectura mt-4 text-ink-soft">
            Conoce los programas del centro y solicita el ingreso de un niño,
            niña o adolescente.
          </p>
        </div>
      </section>

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

        {/* Puente hacia el formulario de inscripción. */}
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
    </>
  );
}
