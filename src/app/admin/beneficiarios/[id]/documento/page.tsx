import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { subirDocumento } from "../../acciones";
import { CATEGORIAS_DOCUMENTO, FormularioDocumento } from "./formulario";

export const metadata: Metadata = { title: "Adjuntar documento" };

export const dynamic = "force-dynamic";

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.DOCUMENTOS_SUBIR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      _count: { select: { documentos: true } },
    },
  });

  if (!beneficiario) notFound();

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Adjuntar un documento"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente} · ${beneficiario._count.documentos} ${beneficiario._count.documentos === 1 ? "documento" : "documentos"} en el expediente`}
      />

      <Tarjeta className="max-w-3xl p-6 sm:p-8">
        <FormularioDocumento
          accion={subirDocumento}
          beneficiarioId={beneficiario.id}
          categorias={CATEGORIAS_DOCUMENTO}
          tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
        />
      </Tarjeta>
    </>
  );
}
