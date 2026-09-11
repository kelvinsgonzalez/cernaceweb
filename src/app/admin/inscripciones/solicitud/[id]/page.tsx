import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Campo, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { calcularEdad, fechaParaInput, formatFecha } from "@/lib/fechas";
import { siguienteCodigo } from "@/lib/expedientes";
import { FormularioPapeleta } from "./formulario";
import { aceptarSolicitud } from "../../acciones";

export const metadata: Metadata = { title: "Papeleta de inscripción" };

export const dynamic = "force-dynamic";

/**
 * El formulario público pide el nombre completo en una sola casilla. Aquí se
 * parte a ojo para no obligar a teclearlo de nuevo: dos nombres y dos apellidos
 * es lo corriente, y quien inscribe lo corrige si no cuadra.
 */
function partirNombre(completo: string): {
  nombres: string;
  apellidos: string;
} {
  const partes = completo.trim().split(/\s+/);
  if (partes.length <= 1) return { nombres: completo.trim(), apellidos: "" };
  const corte = partes.length >= 4 ? 2 : 1;
  return {
    nombres: partes.slice(0, corte).join(" "),
    apellidos: partes.slice(corte).join(" "),
  };
}

export default async function PapeletaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);
  if (!tienePermiso(usuario, PERMISOS.SOLICITUDES_ATENDER))
    redirect("/sin-acceso");

  const [solicitud, programas, codigos, ajustes] = await Promise.all([
    prisma.supportRequest.findUnique({ where: { id } }),
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.beneficiario.findMany({ select: { codigoExpediente: true } }),
    prisma.setting.findMany({
      where: {
        clave: { in: ["inscripciones.cicloVigente", "inscripciones.voBo"] },
      },
    }),
  ]);

  if (!solicitud) notFound();

  // Aceptada ya una vez, no hay papeleta que llenar: se sigue en su expediente.
  if (solicitud.beneficiarioId) {
    redirect(`/admin/beneficiarios/${solicitud.beneficiarioId}`);
  }

  // La inscripción empieza al aceptar en Solicitudes, no al escribir la URL:
  // sin ese paso no hay papeleta que llenar.
  if (solicitud.estado !== "EN_REVISION") redirect("/admin/solicitudes");

  const ajuste = (clave: string) =>
    ajustes.find((a) => a.clave === clave)?.valor ?? "";

  const { nombres, apellidos } = partirNombre(solicitud.nombreNino);
  const pedido = programas.find(
    (p) => p.nombre === solicitud.programaSolicitado,
  );
  const hoy = fechaParaInput(new Date());

  return (
    <>
      <Link
        href="/admin/inscripciones"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a inscripciones
      </Link>

      <EncabezadoPagina
        titulo={`Papeleta de ${solicitud.nombreNino}`}
        descripcion="Llena la hoja completa. Hasta que no aceptes no se crea nada: el expediente, el encargado y la ficha del ciclo nacen juntos."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Tarjeta className="p-6 sm:p-8">
          <FormularioPapeleta
            accion={aceptarSolicitud}
            programas={programas}
            areas={programas.map((p) => p.nombre)}
            puedeClinico={tienePermiso(
              usuario,
              PERMISOS.EXPEDIENTE_CLINICO_LEER,
            )}
            valores={{
              solicitudId: solicitud.id,
              codigoExpediente: siguienteCodigo(
                codigos.map((c) => c.codigoExpediente),
              ),
              nombres,
              apellidos,
              fechaNacimiento: fechaParaInput(solicitud.fechaNacimiento),
              sexo: solicitud.sexo,
              departamento: solicitud.departamento,
              municipio: solicitud.municipio,
              escolaridad: "",
              sector: "",
              telefono: solicitud.encargadoTelefono,
              programaId: pedido?.id ?? "",
              fechaIngreso: hoy,
              encargadoNombre: solicitud.encargadoNombre,
              encargadoParentesco: solicitud.encargadoParentesco,
              encargadoTelefono: solicitud.encargadoTelefono,
              encargadoEmail: solicitud.encargadoEmail ?? "",
              ciclo:
                ajuste("inscripciones.cicloVigente") ||
                String(new Date().getUTCFullYear()),
              fechaInscripcion: hoy,
              responsableInscripcion: usuario.nombre,
              voBo: ajuste("inscripciones.voBo"),
              impresionClinica: solicitud.diagnostico ?? "",
            }}
          />
        </Tarjeta>

        <Tarjeta className="h-fit">
          <TarjetaCabecera
            titulo="Lo que envió la familia"
            descripcion="Tal cual llegó del sitio público."
          />
          <dl className="grid gap-5 p-5">
            <Campo etiqueta="Nombre">{solicitud.nombreNino}</Campo>
            <Campo etiqueta="Edad">
              {calcularEdad(solicitud.fechaNacimiento)} años
            </Campo>
            <Campo etiqueta="Procedencia">
              {solicitud.municipio}, {solicitud.departamento}
            </Campo>
            <Campo etiqueta="Encargado">
              {solicitud.encargadoNombre} ({solicitud.encargadoParentesco})
            </Campo>
            <Campo etiqueta="Diagnóstico">
              {solicitud.diagnostico || "No lo indicaron"}
            </Campo>
            <Campo etiqueta="Programa de interés">
              {solicitud.programaSolicitado || "Sin preferencia"}
            </Campo>
            <Campo etiqueta="Comentarios">
              {solicitud.comentarios || "Sin comentarios"}
            </Campo>
            <Campo etiqueta="Recibida">
              {formatFecha(solicitud.createdAt)}
            </Campo>
          </dl>
        </Tarjeta>
      </div>
    </>
  );
}
