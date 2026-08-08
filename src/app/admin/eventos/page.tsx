import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";

export const metadata: Metadata = { title: "Eventos" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Evento", "Lugar", "Inicia", "Termina", "Cupo", "Estado"];

export default async function EventosPage() {
  await requirePermiso(PERMISOS.EXPEDIENTE_LEER);

  const eventos = await prisma.event.findMany({ orderBy: { inicia: "desc" } });

  return (
    <>
      <EncabezadoPagina
        titulo="Eventos"
        descripcion="Jornadas, talleres y actividades del centro. El alta y la edición de contenido todavía no están implementadas."
      />

      <Tabla caption="Eventos programados por el centro" columnas={COLUMNAS}>
        {eventos.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay eventos registrados." />
        ) : (
          eventos.map((evento) => (
            <Fila key={evento.id}>
              <Celda>
                <span className="font-medium">{evento.titulo}</span>
                <span className="medida-lectura block text-xs text-ink-soft">
                  {evento.descripcion}
                </span>
              </Celda>
              <Celda>{evento.lugar}</Celda>
              <Celda className="whitespace-nowrap">{formatFechaHora(evento.inicia)}</Celda>
              <Celda className="whitespace-nowrap">
                {evento.termina ? formatFechaHora(evento.termina) : "—"}
              </Celda>
              <Celda>{evento.cupo ?? "Sin límite"}</Celda>
              <Celda>
                {evento.estado === "PUBLICADO" ? (
                  <Chip tono="ok">Publicado</Chip>
                ) : (
                  <Chip tono="warn">Borrador</Chip>
                )}
              </Celda>
            </Fila>
          ))
        )}
      </Tabla>
    </>
  );
}
