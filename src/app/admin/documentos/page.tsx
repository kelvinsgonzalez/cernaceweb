import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Kpi } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFecha } from "@/lib/fechas";
import { formatTamano } from "@/lib/utils";

export const metadata: Metadata = { title: "Documentos" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Documento",
  "Expediente",
  "Categoría",
  "Tamaño",
  "Vence",
  "Estado",
  "Subido por",
];

export default async function DocumentosPage() {
  const usuario = await requirePermiso(PERMISOS.DOCUMENTOS_LEER);
  const puedeSubir = tienePermiso(usuario, PERMISOS.DOCUMENTOS_SUBIR);

  const [documentos, vigentes, vencidos] = await Promise.all([
    prisma.documento.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        beneficiario: {
          select: { id: true, nombres: true, apellidos: true, codigoExpediente: true },
        },
      },
    }),
    prisma.documento.count({ where: { vigente: true } }),
    prisma.documento.count({ where: { vigente: false } }),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Documentos"
        descripcion="Todos los documentos adjuntos a los expedientes, en un solo lugar."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Total" valor={documentos.length} />
        <Kpi etiqueta="Vigentes" valor={vigentes} />
        <Kpi etiqueta="Vencidos" valor={vencidos} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-surface p-5">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-primary" />
        <p className="medida-lectura text-sm text-ink-soft">
          {puedeSubir
            ? "Tu rol puede adjuntar documentos. La carga de archivos a un almacenamiento externo (S3 o Cloudinary) todavía no está conectada: por ahora los documentos se registran desde la base de datos."
            : "Tu rol puede consultar los documentos pero no adjuntar nuevos."}
        </p>
      </div>

      <div className="mt-6">
        <Tabla
          caption="Documentos adjuntos a los expedientes de todos los beneficiarios"
          columnas={COLUMNAS}
        >
          {documentos.length === 0 ? (
            <FilaVacia columnas={COLUMNAS.length} mensaje="No hay documentos registrados." />
          ) : (
            documentos.map((documento) => (
              <Fila key={documento.id}>
                <Celda>
                  <span className="font-medium">{documento.nombre}</span>
                  <span className="block font-mono text-xs text-ink-soft">
                    {documento.tipoMime}
                  </span>
                </Celda>
                <Celda>
                  <Link
                    href={`/admin/beneficiarios/${documento.beneficiario.id}`}
                    className="text-brand-primary hover:underline"
                  >
                    {documento.beneficiario.nombres} {documento.beneficiario.apellidos}
                  </Link>
                  <span className="block font-mono text-xs text-ink-soft">
                    {documento.beneficiario.codigoExpediente}
                  </span>
                </Celda>
                <Celda>{documento.categoria}</Celda>
                <Celda>{formatTamano(documento.tamanoBytes)}</Celda>
                <Celda>{formatFecha(documento.fechaVencimiento)}</Celda>
                <Celda>
                  {documento.vigente ? (
                    <Chip tono="ok">Vigente</Chip>
                  ) : (
                    <Chip tono="bad">Vencido</Chip>
                  )}
                </Celda>
                <Celda>{documento.subidoPor}</Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>
    </>
  );
}
