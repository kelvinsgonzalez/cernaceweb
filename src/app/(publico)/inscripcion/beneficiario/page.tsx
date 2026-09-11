import type { Metadata } from "next";
import { Tarjeta } from "@/components/ui";
import { FormularioBeneficiario } from "@/components/formularios-publicos";
import { enviarInscripcionBeneficiario } from "../../acciones";

export const metadata: Metadata = {
  title: "Inscripción de beneficiarios",
  description:
    "Formulario para solicitar el ingreso de un niño o adolescente a los programas de CERNACE.",
};

export const dynamic = "force-dynamic";

export default async function InscripcionBeneficiarioPage() {
  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Inscripción de beneficiarios
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Tarjeta className="p-6 sm:p-8">
          <FormularioBeneficiario accion={enviarInscripcionBeneficiario} />
        </Tarjeta>
      </div>
    </>
  );
}
