import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Historias" };

export const dynamic = "force-dynamic";

export default async function HistoriasPage() {
  await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);

  const historias = await prisma.story.findMany({
    orderBy: { publicadaEn: "desc" },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Historias de avance"
        descripcion="Relatos que se muestran en la página pública. Publican solo el primer nombre del protagonista."
      />

      {historias.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="No hay historias registradas." />
        </Tarjeta>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {historias.map((historia) => (
            <li key={historia.id}>
              <Tarjeta className="h-full p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {historia.titulo}
                  </h2>
                  {historia.estado === "PUBLICADO" ? (
                    <Chip tono="ok">Publicada</Chip>
                  ) : (
                    <Chip tono="warn">Borrador</Chip>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {historia.protagonista}
                  {historia.programa ? ` · ${historia.programa}` : ""} ·{" "}
                  {formatFecha(historia.publicadaEn)}
                </p>
                <p className="medida-lectura mt-3 text-sm text-ink-soft">
                  {historia.resumen}
                </p>
                <p className="mt-3 font-mono text-xs text-ink-soft">
                  /{historia.slug}
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
