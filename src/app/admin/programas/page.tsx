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
import { IconoPrograma } from "@/components/icono-programa";

export const metadata: Metadata = { title: "Programas" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Programa", "Descripción", "Beneficiarios", "Estado"];

export default async function ProgramasPage() {
  await requirePermiso(PERMISOS.EXPEDIENTE_LEER);

  const programas = await prisma.programa.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { beneficiarios: true } } },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Programas"
        descripcion="Áreas de atención del centro. Cada beneficiario se inscribe en un programa tras su evaluación inicial."
      />

      <Tabla
        caption="Programas del centro con el número de beneficiarios inscritos"
        columnas={COLUMNAS}
      >
        {programas.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay programas registrados." />
        ) : (
          programas.map((programa) => (
            <Fila key={programa.id}>
              <Celda>
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
                    <IconoPrograma nombre={programa.icono} className="size-4" />
                  </span>
                  <span className="font-medium">{programa.nombre}</span>
                </span>
              </Celda>
              <Celda className="max-w-lg">{programa.descripcion}</Celda>
              <Celda>{programa._count.beneficiarios}</Celda>
              <Celda>
                {programa.activo ? (
                  <Chip tono="ok">Activo</Chip>
                ) : (
                  <Chip tono="neutro">Inactivo</Chip>
                )}
              </Celda>
            </Fila>
          ))
        )}
      </Tabla>
    </>
  );
}
