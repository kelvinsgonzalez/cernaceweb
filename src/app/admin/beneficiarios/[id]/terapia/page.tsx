import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { calcularEdad, fechaParaInput, formatFecha } from "@/lib/fechas";
import { nombreDeRol } from "@/lib/rbac";
import { listarTerapias } from "@/lib/utils";
import { FormularioPlan, FormularioResponsables } from "./formulario";
import { asignarResponsables, guardarPlan } from "./acciones";

export const metadata: Metadata = { title: "Plan de terapia" };

export const dynamic = "force-dynamic";

export default async function TerapiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.TERAPIA_GESTIONAR);

  const [beneficiario, candidatos] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      include: {
        terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
        plan: true,
        responsables: {
          where: { activo: true },
          select: { terapeutaId: true },
        },
      },
    }),
    // Solo cuentas activas que puedan registrar avances: asignar a quien no
    // puede sería darle una responsabilidad que no podría ejercer.
    prisma.user.findMany({
      where: {
        activo: true,
        roles: {
          some: {
            role: {
              permisos: {
                some: { permission: { clave: PERMISOS.SEGUIMIENTO_ESCRIBIR } },
              },
            },
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        cargo: true,
        curriculum: true,
        roles: { select: { role: { select: { clave: true } } } },
        _count: { select: { asignaciones: { where: { activo: true } } } },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!beneficiario) notFound();

  const plan = beneficiario.plan;
  const asignados = beneficiario.responsables.map((r) => r.terapeutaId);

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
        titulo="Plan de terapia y equipo"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · ${calcularEdad(beneficiario.fechaNacimiento)} años · ${listarTerapias(beneficiario.terapias)}`}
        acciones={
          plan?.activo ? (
            <Chip tono="ok">Aprobado el {formatFecha(plan.fechaAprobacion)}</Chip>
          ) : plan ? (
            <Chip tono="warn">Plan suspendido</Chip>
          ) : (
            <Chip tono="bad">Sin aprobar</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta>
          <TarjetaCabecera
            titulo="Aprobación y objetivo"
            descripcion="Sin un plan aprobado y activo nadie puede registrar avances de este niño."
          />
          <div className="p-5">
            <FormularioPlan
              accion={guardarPlan}
              beneficiarioId={beneficiario.id}
              hoy={fechaParaInput(new Date())}
              valores={{
                objetivoGeneral: plan?.objetivoGeneral ?? "",
                anotaciones: plan?.anotaciones ?? "",
                fechaAprobacion: plan
                  ? fechaParaInput(plan.fechaAprobacion)
                  : "",
                activo: plan?.activo ?? true,
                existe: Boolean(plan),
              }}
            />
            {plan ? (
              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-soft">
                Última aprobación registrada por {plan.aprobadoPor}.
              </p>
            ) : null}
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera
            titulo="Equipo responsable"
            descripcion="Quienes pueden atender al niño y publicar reseñas de sus avances."
          />
          <div className="p-5">
            <FormularioResponsables
              accion={asignarResponsables}
              beneficiarioId={beneficiario.id}
              asignados={asignados}
              candidatos={candidatos.map((c) => ({
                id: c.id,
                nombre: c.nombre,
                cargo: c.cargo,
                curriculum: c.curriculum,
                roles: c.roles.map((r) => nombreDeRol(r.role.clave)).join(", "),
                casos: c._count.asignaciones,
              }))}
            />
          </div>
        </Tarjeta>
      </div>
    </>
  );
}
