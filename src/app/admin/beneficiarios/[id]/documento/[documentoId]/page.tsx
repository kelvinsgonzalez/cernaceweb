import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { fechaParaInput, formatFecha } from "@/lib/fechas";
import { formatTamano } from "@/lib/utils";
import { actualizarDocumento } from "../../../acciones";
import { CATEGORIAS_DOCUMENTO, FormularioDocumento } from "../formulario";

export const metadata: Metadata = { title: "Corregir documento" };

export const dynamic = "force-dynamic";

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ id: string; documentoId: string }>;
}) {
  const { id, documentoId } = await params;
  await requirePermiso(PERMISOS.DOCUMENTOS_SUBIR);

  const [beneficiario, documento] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
      },
    }),
    prisma.documento.findUnique({ where: { id: documentoId } }),
  ]);

  if (!beneficiario || !documento || documento.beneficiarioId !== beneficiario.id) {
    notFound();
  }

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}#documentos`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Corregir el documento"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          <Chip tono="neutro">
            {formatTamano(documento.tamanoBytes)} · adjuntado el{" "}
            {formatFecha(documento.createdAt)}
          </Chip>
        }
      />

      <Tarjeta className="max-w-3xl p-6 sm:p-8">
        <FormularioDocumento
          accion={actualizarDocumento}
          beneficiarioId={beneficiario.id}
          documentoId={documento.id}
          categorias={CATEGORIAS_DOCUMENTO}
          tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
          valores={{
            nombre: documento.nombre,
            categoria: documento.categoria,
            fechaVencimiento: documento.fechaVencimiento
              ? fechaParaInput(documento.fechaVencimiento)
              : "",
            visibleParaPadrino: documento.visibleParaPadrino,
          }}
        />
      </Tarjeta>
    </>
  );
}
