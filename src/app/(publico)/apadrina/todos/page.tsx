import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnlaceBoton } from "@/components/ui";
import {
  GaleriaBeneficiarios,
  beneficiariosQueEsperan,
} from "@/components/galeria-beneficiarios";

export const metadata: Metadata = {
  title: "Todos los beneficiarios que esperan padrino",
  description:
    "El listado completo de beneficiarios de CERNACE que todavía no tienen un padrino asignado.",
};

export const dynamic = "force-dynamic";

/**
 * El listado completo. /apadrina enseña solo a los tres que llevan más tiempo
 * esperando; aquí están todos, en el mismo orden.
 */
export default async function TodosLosBeneficiariosPage() {
  const ninos = await beneficiariosQueEsperan();

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Link
            href="/apadrina"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a apadrinar
          </Link>
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Beneficiarios que esperan padrino
          </h1>
          <p className="medida-lectura mt-4 text-ink-soft">
            Publicamos únicamente su primer nombre, su edad y las terapias que
            recibe. El resto del expediente es confidencial.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-soft" role="status">
            {ninos.length}{" "}
            {ninos.length === 1
              ? "beneficiario esperando padrino"
              : "beneficiarios esperando padrino"}
          </p>
          <EnlaceBoton href="/inscripcion/padrino" className="px-5 py-2.5">
            Quiero ser padrino
          </EnlaceBoton>
        </div>

        <GaleriaBeneficiarios ninos={ninos} className="mt-4" />
      </div>
    </>
  );
}
