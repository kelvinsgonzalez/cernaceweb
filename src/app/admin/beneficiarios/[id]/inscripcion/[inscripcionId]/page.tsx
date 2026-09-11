import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { calcularEdad, fechaParaInput, formatFecha } from "@/lib/fechas";
import { FormularioInscripcion } from "../formulario";
import { actualizarInscripcion } from "@/app/admin/inscripciones/acciones";

export const metadata: Metadata = { title: "Corregir la ficha de inscripción" };

export const dynamic = "force-dynamic";

export default async function EditarInscripcionPage({
  params,
}: {
  params: Promise<{ id: string; inscripcionId: string }>;
}) {
  const { id, inscripcionId } = await params;
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);
  const puedeClinico = tienePermiso(usuario, PERMISOS.EXPEDIENTE_CLINICO_LEER);

  const [beneficiario, ficha, programas] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      include: { encargado: true },
    }),
    prisma.inscripcion.findUnique({ where: { id: inscripcionId } }),
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { nombre: true },
    }),
  ]);

  // Una ficha de otro expediente no se corrige desde aquí, aunque el id exista.
  if (!beneficiario || !ficha || ficha.beneficiarioId !== beneficiario.id) {
    notFound();
  }

  const e = beneficiario.encargado;

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}#inscripciones`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo={`Ficha del ciclo ${ficha.ciclo}`}
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · ${calcularEdad(beneficiario.fechaNacimiento)} años · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          <Chip tono="info">
            Inscrito el {formatFecha(ficha.fechaInscripcion)}
          </Chip>
        }
      />

      <Tarjeta className="p-6 sm:p-8">
        <FormularioInscripcion
          accion={actualizarInscripcion}
          beneficiarioId={beneficiario.id}
          inscripcionId={ficha.id}
          areas={programas.map((p) => p.nombre)}
          puedeClinico={puedeClinico}
          valores={{
            escolaridad: beneficiario.escolaridad ?? "",
            sector: beneficiario.sector ?? "",
            telefono: beneficiario.telefono ?? "",
            solicitaPatrocinio: beneficiario.solicitaPatrocinio,
            encargadoNombre: e?.nombre ?? "",
            encargadoParentesco: e?.parentesco ?? "",
            encargadoSexo: e?.sexo ?? "",
            encargadoEdad: e?.edad != null ? String(e.edad) : "",
            encargadoIdentificacion: e?.noIdentificacion ?? "",
            encargadoEstadoCivil: e?.estadoCivil ?? "",
            encargadoSituacionLaboral: e?.situacionLaboral ?? "",
            encargadoEscolaridad: e?.escolaridad ?? "",
            encargadoOficio: e?.oficio ?? "",
            encargadoIntegrantes:
              e?.integrantesFamilia != null ? String(e.integrantesFamilia) : "",
            encargadoDireccion: e?.direccion ?? "",
            encargadoTelefono: e?.telefono ?? "",
            encargadoEmail: e?.email ?? "",
            ciclo: String(ficha.ciclo),
            fechaInscripcion: fechaParaInput(ficha.fechaInscripcion),
            tipoIngreso: ficha.tipoIngreso,
            fechaPrimerIngreso: ficha.fechaPrimerIngreso
              ? fechaParaInput(ficha.fechaPrimerIngreso)
              : "",
            referidoPor: ficha.referidoPor ?? "",
            areaServicio: ficha.areaServicio ?? "",
            responsableInscripcion: ficha.responsableInscripcion,
            voBo: ficha.voBo ?? "",
            // El área clínica solo se precarga a quien puede leerla; sin ese
            // permiso el formulario ni siquiera enseña los campos.
            impresionClinica: puedeClinico ? (ficha.impresionClinica ?? "") : "",
            otrasEnfermedades: puedeClinico
              ? (ficha.otrasEnfermedades ?? "")
              : "",
          }}
        />
      </Tarjeta>
    </>
  );
}
