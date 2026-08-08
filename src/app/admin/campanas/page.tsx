import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Progreso, Tarjeta, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Campañas" };

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  await requirePermiso(PERMISOS.DONACIONES_LEER);

  const campanas = await prisma.campaign.findMany({
    orderBy: { fechaInicio: "desc" },
    include: { _count: { select: { donaciones: true } } },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Campañas"
        descripcion="Recaudaciones con meta y fecha. Las campañas activas aparecen en la página pública de donaciones."
      />

      {campanas.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="No hay campañas registradas." />
        </Tarjeta>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {campanas.map((campana) => {
            const meta = aNumero(campana.meta);
            const recaudado = aNumero(campana.recaudado);
            return (
              <li key={campana.id}>
                <Tarjeta className="h-full p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold text-ink">
                      {campana.titulo}
                    </h2>
                    {campana.activa ? (
                      <Chip tono="ok">Activa</Chip>
                    ) : (
                      <Chip tono="neutro">Cerrada</Chip>
                    )}
                  </div>
                  <p className="medida-lectura mt-2 text-sm text-ink-soft">
                    {campana.descripcion}
                  </p>

                  <div className="mt-5">
                    <Progreso
                      valor={meta > 0 ? (recaudado / meta) * 100 : 0}
                      etiqueta="Avance de la meta"
                    />
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Recaudado
                      </dt>
                      <dd className="mt-1 text-ink">{formatQuetzales(recaudado)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Meta
                      </dt>
                      <dd className="mt-1 text-ink">{formatQuetzales(meta)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Periodo
                      </dt>
                      <dd className="mt-1 text-ink">
                        {formatFecha(campana.fechaInicio)} —{" "}
                        {campana.fechaFin ? formatFecha(campana.fechaFin) : "sin cierre"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Donaciones
                      </dt>
                      <dd className="mt-1 text-ink">{campana._count.donaciones}</dd>
                    </div>
                  </dl>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
