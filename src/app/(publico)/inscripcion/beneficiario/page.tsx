import type { Metadata } from "next";
import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
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
  const programas = await prisma.programa.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { nombre: true },
  });

  return (
    <>
      <section className="bg-brand-sky">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-heading text-4xl font-bold text-brand-dark">
            Inscripción de beneficiarios
          </h1>
          <p className="medida-lectura mt-4 text-lg text-ink">
            Llena este formulario para solicitar el ingreso de un niño, niña o
            adolescente a nuestros programas. La solicitud llega directamente al
            equipo de trabajo social, que agenda la evaluación inicial.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-surface p-5">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-primary" />
          <p className="medida-lectura text-sm text-ink-soft">
            Los campos marcados con asterisco son obligatorios. No pedimos
            documentos en este paso: se solicitan durante la evaluación
            presencial.
          </p>
        </div>

        <Tarjeta className="p-6 sm:p-8">
          <FormularioBeneficiario
            accion={enviarInscripcionBeneficiario}
            programas={programas.map((p) => p.nombre)}
          />
        </Tarjeta>
      </div>
    </>
  );
}
