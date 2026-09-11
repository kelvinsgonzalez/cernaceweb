import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Tarjeta } from "@/components/ui";
import { FormularioDonacion } from "@/components/formularios-publicos";
import { iniciarDonacion } from "../acciones";

export const metadata: Metadata = {
  title: "Donar",
  description: "Haz una donación a CERNACE. Modo prueba.",
};

export const dynamic = "force-dynamic";

export default async function DonarPage() {
  const [campanas, ajuste] = await Promise.all([
    prisma.campaign.findMany({
      where: { activa: true },
      orderBy: { titulo: "asc" },
    }),
    prisma.setting.findUnique({ where: { clave: "donaciones.aporteSugerido" } }),
  ]);

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="rotulo aparece text-brand-primary">Aportes</p>
          <h1 className="filete aparece aparece-2 mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Haz una donación
          </h1>
          <p className="medida-lectura aparece aparece-3 mt-4 text-lg text-ink">
            Cada aporte se registra con su referencia y su comprobante. Puedes
            donar una sola vez o dejar un aporte mensual.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="medida-lectura text-sm font-medium">
            Esta pasarela está en <strong>modo prueba</strong>. No se procesan
            cobros reales y en ningún paso se piden ni se guardan datos de
            tarjeta.
          </p>
        </div>

        <Tarjeta className="p-6 sm:p-8">
          <FormularioDonacion
            accion={iniciarDonacion}
            campanas={campanas.map((c) => ({ id: c.id, titulo: c.titulo }))}
            montoSugerido={ajuste?.valor ?? "350"}
          />
        </Tarjeta>
      </div>
    </>
  );
}
