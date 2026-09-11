import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { AccesoRestringido, Chip, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { fechaParaInput } from "@/lib/fechas";
import { registrarAvance } from "../../acciones";
import { MAXIMO_FOTOS } from "@/lib/almacenamiento";
import { FormularioAvance } from "./formulario";

export const metadata: Metadata = { title: "Registrar avance" };

export const dynamic = "force-dynamic";

export default async function AvancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      plan: true,
      responsables: {
        where: { activo: true },
        select: {
          terapeutaId: true,
          terapeuta: { select: { nombre: true } },
        },
      },
      padrinazgos: {
        where: { activo: true },
        select: { padrino: { select: { nombre: true } } },
      },
    },
  });

  if (!beneficiario) notFound();

  const padrino = beneficiario.padrinazgos[0]?.padrino.nombre;
  const gestiona = usuario.permisos.includes(PERMISOS.TERAPIA_GESTIONAR);
  const esResponsable = beneficiario.responsables.some(
    (r) => r.terapeutaId === usuario.id,
  );

  // Las mismas dos condiciones que comprueba el server action. Aquí solo se
  // evita ofrecer un formulario que iba a ser rechazado.
  const aprobado = Boolean(beneficiario.plan?.activo);
  const puedeRegistrar = aprobado && (gestiona || esResponsable);

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
        titulo="Registrar un avance"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}${
          padrino ? ` · padrino asignado: ${padrino}` : " · sin padrino asignado"
        }`}
      />

      {beneficiario.plan ? (
        <Tarjeta className="mb-6 max-w-3xl">
          <TarjetaCabecera
            titulo="Objetivo general del tratamiento"
            descripcion="Fijado por la administración. Lo comparte todo el equipo."
            icono={<Target className="size-5" />}
            acciones={
              beneficiario.responsables.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {beneficiario.responsables.map((r) => (
                    <Chip key={r.terapeutaId} tono="info">
                      {r.terapeuta.nombre}
                    </Chip>
                  ))}
                </div>
              ) : undefined
            }
          />
          <div className="space-y-3 p-5">
            <p className="medida-lectura text-sm text-ink">
              {beneficiario.plan.objetivoGeneral}
            </p>
            {beneficiario.plan.anotaciones ? (
              <p className="medida-lectura text-sm text-ink-soft">
                <span className="font-semibold text-ink">Anotaciones: </span>
                {beneficiario.plan.anotaciones}
              </p>
            ) : null}
          </div>
        </Tarjeta>
      ) : null}

      <Tarjeta className="max-w-3xl p-6 sm:p-8">
        {!aprobado ? (
          <AccesoRestringido
            titulo="Todavía no está aprobado para terapia"
            mensaje={
              beneficiario.plan
                ? "El plan de este beneficiario está suspendido, así que no se pueden registrar avances. Un administrador puede reactivarlo."
                : "Un administrador tiene que aprobar el plan de terapia y fijar su objetivo general antes de que se registren avances."
            }
          />
        ) : !puedeRegistrar ? (
          <AccesoRestringido
            titulo="No eres responsable de este beneficiario"
            mensaje="Solo el equipo asignado registra sus avances. Si vas a atenderlo, pide a un administrador que te asigne."
          />
        ) : (
          <FormularioAvance
            accion={registrarAvance}
            beneficiarioId={beneficiario.id}
            hoy={fechaParaInput(new Date())}
            maximoFotos={MAXIMO_FOTOS}
          />
        )}
      </Tarjeta>
    </>
  );
}
