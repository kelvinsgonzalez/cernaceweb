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
import { formatFecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Blog" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Entrada", "Categoría", "Autor", "Publicada", "Ruta", "Estado"];

export default async function BlogPage() {
  await requirePermiso(PERMISOS.EXPEDIENTE_LEER);

  const entradas = await prisma.post.findMany({
    orderBy: { publicadoEn: "desc" },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Blog"
        descripcion="Guías y notas de transparencia dirigidas a familias y donantes."
      />

      <Tabla caption="Entradas del blog institucional" columnas={COLUMNAS}>
        {entradas.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay entradas publicadas." />
        ) : (
          entradas.map((entrada) => (
            <Fila key={entrada.id}>
              <Celda>
                <span className="font-medium">{entrada.titulo}</span>
                <span className="medida-lectura block text-xs text-ink-soft">
                  {entrada.resumen}
                </span>
              </Celda>
              <Celda>{entrada.categoria}</Celda>
              <Celda>{entrada.autor}</Celda>
              <Celda className="whitespace-nowrap">
                {formatFecha(entrada.publicadoEn)}
              </Celda>
              <Celda className="font-mono text-xs">/{entrada.slug}</Celda>
              <Celda>
                {entrada.estado === "PUBLICADO" ? (
                  <Chip tono="ok">Publicada</Chip>
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
