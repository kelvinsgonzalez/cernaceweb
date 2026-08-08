import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Tarjeta } from "@/components/ui";
import { FormularioPadrino } from "@/components/formularios-publicos";
import { enviarInscripcionPadrino } from "../../acciones";

export const metadata: Metadata = {
  title: "Inscripción de padrinos",
  description:
    "Formulario para apadrinar a un beneficiario de CERNACE con un aporte mensual.",
};

export const dynamic = "force-dynamic";

const COMPROMISOS = [
  "Un aporte mensual que sostiene terapias, material adaptado y transporte.",
  "Acceso al portal del padrino para consultar los avances publicados.",
  "Un informe trimestral con el desglose de en qué se usó tu aporte.",
];

export default async function InscripcionPadrinoPage() {
  const [ajuste, sinPadrino] = await Promise.all([
    prisma.setting.findUnique({ where: { clave: "donaciones.aporteSugerido" } }),
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
    }),
  ]);

  return (
    <>
      <section className="bg-brand-sky">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-heading text-4xl font-bold text-brand-dark">
            Inscríbete como padrino
          </h1>
          <p className="medida-lectura mt-4 text-lg text-ink">
            Hoy hay {sinPadrino}{" "}
            {sinPadrino === 1 ? "beneficiario" : "beneficiarios"} sin apoyo
            asignado. Al inscribirte, el equipo te asigna a uno y te da acceso
            al portal para seguir su progreso.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
        <Tarjeta className="p-6 sm:p-8">
          <FormularioPadrino
            accion={enviarInscripcionPadrino}
            aporteSugerido={ajuste?.valor ?? "350"}
          />
        </Tarjeta>

        <aside aria-labelledby="que-incluye">
          <Tarjeta className="p-6">
            <h2 id="que-incluye" className="font-heading text-lg font-semibold text-ink">
              Qué incluye el apadrinamiento
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {COMPROMISOS.map((punto) => (
                <li key={punto} className="medida-lectura">
                  {punto}
                </li>
              ))}
            </ul>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
