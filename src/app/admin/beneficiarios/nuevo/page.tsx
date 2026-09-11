import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { fechaParaInput } from "@/lib/fechas";
import { siguienteCodigo } from "@/lib/expedientes";
import { crearBeneficiario } from "../acciones";
import { FormularioEditar } from "../[id]/editar/formulario";

export const metadata: Metadata = { title: "Nuevo expediente" };

export const dynamic = "force-dynamic";

export default async function NuevoBeneficiarioPage() {
  await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const [programas, codigos] = await Promise.all([
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.beneficiario.findMany({ select: { codigoExpediente: true } }),
  ]);

  return (
    <>
      <Link
        href="/admin/beneficiarios"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a beneficiarios
      </Link>

      <EncabezadoPagina
        titulo="Nuevo expediente"
        descripcion="Alta manual, para expedientes de papel y para quien ingresa presencialmente sin haber enviado solicitud. La apertura queda registrada en la bitácora."
      />

      <Tarjeta className="p-6 sm:p-8">
        <FormularioEditar
          modo="crear"
          accion={crearBeneficiario}
          programas={programas}
          valores={{
            id: "",
            codigoExpediente: siguienteCodigo(
              codigos.map((c) => c.codigoExpediente),
            ),
            fechaIngreso: fechaParaInput(new Date()),
            nombres: "",
            apellidos: "",
            fechaNacimiento: "",
            sexo: "MASCULINO",
            cui: "",
            lugarNacimiento: "",
            idiomaHogar: "",
            tipoSangre: "",
            direccion: "",
            municipio: "",
            departamento: "",
            zonaResidencia: "",
            sector: "",
            escolaridad: "",
            telefono: "",
            encargadoNombre: "",
            encargadoParentesco: "",
            encargadoTelefono: "",
            encargadoEmail: "",
            encargadoSexo: "",
            encargadoEdad: "",
            encargadoIdentificacion: "",
            encargadoEstadoCivil: "",
            encargadoSituacionLaboral: "",
            encargadoEscolaridad: "",
            encargadoOficio: "",
            encargadoIntegrantes: "",
            encargadoDireccion: "",
            programaId: programas[0]?.id ?? "",
            solicitaPatrocinio: false,
            estado: "ACTIVO",
            estadoExpediente: "INCOMPLETO",
          }}
        />
      </Tarjeta>
    </>
  );
}
