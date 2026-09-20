import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Stethoscope } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import {
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import { fechaParaInput, formatFecha } from "@/lib/fechas";
import {
  eliminarEvaluacionClinica,
  guardarExpedienteClinico,
  registrarEvaluacionClinica,
} from "../../acciones";
import { FormularioClinico, FormularioEvaluacion } from "./formulario";

export const metadata: Metadata = { title: "Expediente clínico" };

export const dynamic = "force-dynamic";

export default async function ClinicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR);

  const [beneficiario, clinico, evaluaciones] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
      },
    }),
    prisma.expedienteClinico.findUnique({ where: { beneficiarioId: id } }),
    prisma.evaluacionClinica.findMany({
      where: { beneficiarioId: id },
      orderBy: { fecha: "desc" },
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
        titulo="Expediente clínico"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          <Chip tono="bad" icono={<Lock aria-hidden="true" className="size-4" />}>
            Confidencial
          </Chip>
        }
      />

      <div className="space-y-6">
        <Tarjeta className="p-6 sm:p-8">
          <TarjetaCabecera
            titulo={clinico ? "Corregir el expediente clínico" : "Registrar el expediente clínico"}
            descripcion="Hay uno por beneficiario. Al guardar se sustituye lo que había y el cambio queda en la bitácora."
            icono={<Stethoscope className="size-5" />}
          />
          <div className="pt-6">
            <FormularioClinico
              accion={guardarExpedienteClinico}
              beneficiarioId={beneficiario.id}
              valores={{
                diagnosticoPrincipal: clinico?.diagnosticoPrincipal ?? "",
                codigoCie10: clinico?.codigoCie10 ?? "",
                fechaDiagnostico: clinico?.fechaDiagnostico
                  ? fechaParaInput(clinico.fechaDiagnostico)
                  : "",
                tipoDiscapacidad: clinico?.tipoDiscapacidad ?? "",
                gradoDependencia: clinico?.gradoDependencia ?? "",
                medicoTratante: clinico?.medicoTratante ?? "",
                alergias: clinico?.alergias ?? "",
                medicamentos: clinico?.medicamentos ?? "",
                antecedentes: clinico?.antecedentes ?? "",
              }}
            />
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera
            titulo="Registrar una evaluación"
            descripcion="Cada evaluación se suma al historial; las anteriores no se tocan."
          />
          <div className="p-5">
            <FormularioEvaluacion
              accion={registrarEvaluacionClinica}
              beneficiarioId={beneficiario.id}
              hoy={fechaParaInput(new Date())}
            />
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera
            titulo="Evaluaciones registradas"
            acciones={
              <Chip tono="neutro">
                {evaluaciones.length}{" "}
                {evaluaciones.length === 1 ? "evaluación" : "evaluaciones"}
              </Chip>
            }
          />
          <Tabla
            caption={`Evaluaciones clínicas de ${beneficiario.nombres} ${beneficiario.apellidos}`}
            columnas={["Fecha", "Tipo", "Profesional", "Resultado", "Documento", ""]}
          >
            {evaluaciones.length === 0 ? (
              <FilaVacia columnas={6} mensaje="Sin evaluaciones registradas." />
            ) : (
              evaluaciones.map((evaluacion) => (
                <Fila key={evaluacion.id}>
                  <Celda className="whitespace-nowrap">
                    {formatFecha(evaluacion.fecha)}
                  </Celda>
                  <Celda>{evaluacion.tipo}</Celda>
                  <Celda>{evaluacion.profesional}</Celda>
                  <Celda className="max-w-md">{evaluacion.resultado}</Celda>
                  <Celda>
                    {evaluacion.documento ? (
                      <span className="font-mono text-xs">
                        {evaluacion.documento}
                      </span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </Celda>
                  <Celda className="whitespace-nowrap">
                    <MenuAcciones
                      id={evaluacion.id}
                      etiqueta={`Acciones de la evaluación del ${formatFecha(evaluacion.fecha)}`}
                      titulo={evaluacion.tipo}
                    >
                      <OpcionConfirmada
                        menu={evaluacion.id}
                        tono="peligro"
                        etiqueta="Eliminar"
                        mensaje="Se borra la evaluación del expediente. No se puede recuperar: lo único que queda es el registro en la bitácora."
                        confirmar="Sí, eliminar"
                        accion={eliminarEvaluacionClinica}
                      >
                        <input type="hidden" name="id" value={evaluacion.id} />
                      </OpcionConfirmada>
                    </MenuAcciones>
                  </Celda>
                </Fila>
              ))
            )}
          </Tabla>
        </Tarjeta>
      </div>
    </>
  );
}
