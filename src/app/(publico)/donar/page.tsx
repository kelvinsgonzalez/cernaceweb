import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Tarjeta } from "@/components/ui";
import { FormularioDonacion } from "@/components/formularios-publicos";
import { formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
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
      <section className="bg-brand-sky">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="font-heading text-4xl font-bold text-brand-dark">
            Haz una donación
          </h1>
          <p className="medida-lectura mt-4 text-lg text-ink">
            Cada aporte se registra con su referencia y su comprobante. Puedes
            donar una sola vez o dejar un aporte mensual.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
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

        <aside aria-labelledby="campanas-activas">
          <Tarjeta className="p-6">
            <h2 id="campanas-activas" className="font-heading text-lg font-semibold text-ink">
              Campañas activas
            </h2>
            <ul className="mt-4 space-y-5">
              {campanas.map((campana) => {
                const meta = aNumero(campana.meta);
                const recaudado = aNumero(campana.recaudado);
                const porcentaje = meta > 0 ? Math.round((recaudado / meta) * 100) : 0;
                return (
                  <li key={campana.id}>
                    <h3 className="text-sm font-semibold text-ink">{campana.titulo}</h3>
                    <p className="medida-lectura mt-1 text-sm text-ink-soft">
                      {campana.descripcion}
                    </p>
                    <div
                      role="progressbar"
                      aria-valuenow={porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Avance de ${campana.titulo}`}
                      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas"
                    >
                      <div
                        className="h-full rounded-full bg-brand-green"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ink-soft">
                      {formatQuetzales(recaudado)} de {formatQuetzales(meta)} ({porcentaje}%)
                    </p>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
