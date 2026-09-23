import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton } from "@/components/ui";
import {
  FILTRO_ESPERAN_PADRINO,
  GaleriaBeneficiarios,
  beneficiariosQueEsperan,
} from "@/components/galeria-beneficiarios";
import { SeccionComoAyudar } from "@/components/como-ayudar";
import { CarruselHistorias } from "@/components/carrusel-historias";

export const metadata: Metadata = {
  title: "Apadrina a un niño",
  description:
    "Beneficiarios de CERNACE que todavía no tienen un padrino asignado.",
};

export const dynamic = "force-dynamic";

/** Cuántos se enseñan en esta página; el resto está en /apadrina/todos. */
const DESTACADOS = 3;

export default async function GaleriaPage() {
  const [sinPadrino, publicados, ninos] = await Promise.all([
    // Todos los activos sin padrino, publicados o no: es el tamaño real de la
    // necesidad, no solo la parte que se enseña en la galería.
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
    }),
    prisma.beneficiario.count({ where: FILTRO_ESPERAN_PADRINO }),
    // Los tres que llevan más tiempo esperando.
    beneficiariosQueEsperan(DESTACADOS),
  ]);

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Juntos podemos crear posibilidades
          </h1>
        </div>
      </section>

      <SeccionComoAyudar />

      {/* Las historias de éxito: lo que el apadrinamiento hace posible. */}
      <CarruselHistorias className="mx-auto max-w-6xl px-4 py-12 sm:py-16" />

      {/* La llamada: cuántos esperan y los dos caminos para ayudar. */}
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

      {/* Los tres que llevan más tiempo esperando; el listado completo tiene
          su propia página. */}
      <section
        className="mx-auto max-w-6xl px-4 py-10 sm:py-14"
        aria-labelledby="esperan-titulo"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="esperan-titulo"
              className="font-heading text-3xl font-semibold text-ink sm:text-4xl"
            >
              Beneficiarios que esperan padrino
            </h2>
            <p className="medida-lectura mt-3 text-ink-soft">
              Publicamos únicamente su primer nombre, su edad y las terapias que
              recibe. El resto del expediente es confidencial.
            </p>
          </div>
          <EnlaceBoton href="/apadrina/todos" variante="contorno">
            Ver a todos
            {publicados > 0 ? ` (${publicados})` : ""}
          </EnlaceBoton>
        </div>

        <GaleriaBeneficiarios ninos={ninos} className="mt-8" />
      </section>
    </>
  );
}
