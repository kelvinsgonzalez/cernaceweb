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

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    include: { encargado: true },
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
        titulo={`Editar ${beneficiario.nombres} ${beneficiario.apellidos}`}
        descripcion={`Expediente ${beneficiario.codigoExpediente}. Los cambios quedan registrados en la bitácora de auditoría.`}
      />

      <Tarjeta className="p-6 sm:p-8">
        <FormularioEditar
          accion={guardarDatosGenerales}
          valores={{
            id: beneficiario.id,
            codigoExpediente: beneficiario.codigoExpediente,
            fechaIngreso: fechaParaInput(beneficiario.fechaIngreso),
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
            sector: beneficiario.sector ?? "",
            escolaridad: beneficiario.escolaridad ?? "",
            telefono: beneficiario.telefono ?? "",
            encargadoNombre: beneficiario.encargado?.nombre ?? "",
            encargadoParentesco: beneficiario.encargado?.parentesco ?? "",
            encargadoTelefono: beneficiario.encargado?.telefono ?? "",
            encargadoEmail: beneficiario.encargado?.email ?? "",
            encargadoSexo: beneficiario.encargado?.sexo ?? "",
            encargadoEdad: beneficiario.encargado?.edad?.toString() ?? "",
            encargadoIdentificacion:
              beneficiario.encargado?.noIdentificacion ?? "",
            encargadoEstadoCivil: beneficiario.encargado?.estadoCivil ?? "",
            encargadoSituacionLaboral:
              beneficiario.encargado?.situacionLaboral ?? "",
            encargadoEscolaridad: beneficiario.encargado?.escolaridad ?? "",
            encargadoOficio: beneficiario.encargado?.oficio ?? "",
            encargadoIntegrantes:
              beneficiario.encargado?.integrantesFamilia?.toString() ?? "",
            encargadoDireccion: beneficiario.encargado?.direccion ?? "",
            centroAtencion: beneficiario.centroAtencion,
            solicitaPatrocinio: beneficiario.solicitaPatrocinio,
            estado: beneficiario.estado,
            estadoExpediente: beneficiario.estadoExpediente,
          }}
        />
      </Tarjeta>
    </>
  );
}
