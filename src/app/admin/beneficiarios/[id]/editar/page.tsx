import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { fechaParaInput } from "@/lib/fechas";
import { guardarDatosGenerales } from "../../acciones";
import { FormularioEditar } from "./formulario";

export const metadata: Metadata = { title: "Editar expediente" };

export const dynamic = "force-dynamic";

export default async function EditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const [beneficiario, programas] = await Promise.all([
    prisma.beneficiario.findUnique({ where: { id } }),
    prisma.programa.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

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
        titulo={`Editar ${beneficiario.nombres} ${beneficiario.apellidos}`}
        descripcion={`Expediente ${beneficiario.codigoExpediente}. Los cambios quedan registrados en la bitácora de auditoría.`}
      />

      <Tarjeta className="p-6 sm:p-8">
        <FormularioEditar
          accion={guardarDatosGenerales}
          programas={programas}
          valores={{
            id: beneficiario.id,
            nombres: beneficiario.nombres,
            apellidos: beneficiario.apellidos,
            fechaNacimiento: fechaParaInput(beneficiario.fechaNacimiento),
            sexo: beneficiario.sexo,
            cui: beneficiario.cui ?? "",
            lugarNacimiento: beneficiario.lugarNacimiento ?? "",
            idiomaHogar: beneficiario.idiomaHogar ?? "",
            tipoSangre: beneficiario.tipoSangre ?? "",
            direccion: beneficiario.direccion ?? "",
            municipio: beneficiario.municipio,
            departamento: beneficiario.departamento,
            zonaResidencia: beneficiario.zonaResidencia ?? "",
            encargadoNombre: beneficiario.encargadoNombre,
            encargadoParentesco: beneficiario.encargadoParentesco,
            encargadoTelefono: beneficiario.encargadoTelefono,
            encargadoEmail: beneficiario.encargadoEmail ?? "",
            programaId: beneficiario.programaId,
            estado: beneficiario.estado,
            estadoExpediente: beneficiario.estadoExpediente,
            publicadoEnGaleria: beneficiario.publicadoEnGaleria,
            resumenPublico: beneficiario.resumenPublico ?? "",
          }}
        />
      </Tarjeta>
    </>
  );
}
