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
import { FormularioInscripcion } from "./formulario";
import { registrarInscripcion } from "@/app/admin/inscripciones/acciones";

export const metadata: Metadata = { title: "Ficha de inscripción" };

export const dynamic = "force-dynamic";

export default async function InscripcionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);

  const [beneficiario, programas, ajustes] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      include: {
        encargado: true,
        programa: { select: { nombre: true } },
        inscripciones: { orderBy: { ciclo: "desc" }, take: 1 },
      },
    }),
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { nombre: true },
    }),
    prisma.setting.findMany({
      where: { clave: { in: ["inscripciones.cicloVigente", "inscripciones.voBo"] } },
    }),
  ]);

  if (!beneficiario) notFound();

  const ajuste = (clave: string) =>
    ajustes.find((a) => a.clave === clave)?.valor ?? "";

  const previa = beneficiario.inscripciones[0];
  const cicloVigente =
    ajuste("inscripciones.cicloVigente") || String(new Date().getUTCFullYear());

  // Si ya hubo una inscripción, esta es un reingreso y la fecha de primer
  // ingreso se arrastra de la anterior en vez de volver a preguntarla.
  const esReingreso = Boolean(previa);
  const primerIngreso = previa?.fechaPrimerIngreso ?? beneficiario.fechaIngreso;

  const e = beneficiario.encargado;

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
        titulo="Ficha de inscripción"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · ${calcularEdad(beneficiario.fechaNacimiento)} años · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          previa ? (
            <Chip tono="info">
              Última inscripción: ciclo {previa.ciclo} ·{" "}
              {formatFecha(previa.fechaInscripcion)}
            </Chip>
          ) : (
            <Chip tono="warn">Sin inscripciones previas</Chip>
          )
        }
      />

      <Tarjeta className="p-6 sm:p-8">
        <FormularioInscripcion
          accion={registrarInscripcion}
          beneficiarioId={beneficiario.id}
          areas={programas.map((p) => p.nombre)}
          puedeClinico={tienePermiso(usuario, PERMISOS.EXPEDIENTE_CLINICO_LEER)}
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
            ciclo: cicloVigente,
            fechaInscripcion: fechaParaInput(new Date()),
            tipoIngreso: esReingreso ? "REINGRESO" : "PRIMER_INGRESO",
            fechaPrimerIngreso: fechaParaInput(primerIngreso),
            referidoPor: "",
            areaServicio: "",
            responsableInscripcion: usuario.nombre,
            voBo: ajuste("inscripciones.voBo"),
            impresionClinica: "",
            otrasEnfermedades: "",
          }}
        />
      </Tarjeta>
    </>
  );
}
