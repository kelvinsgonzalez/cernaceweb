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
import { registrarAvance } from "../../acciones";
import { FormularioAvance } from "./formulario";

export const metadata: Metadata = { title: "Registrar avance" };

export const dynamic = "force-dynamic";

export default async function AvancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      padrinazgos: {
        where: { activo: true },
        select: { padrino: { select: { nombre: true } } },
      },
    },
  });

  if (!beneficiario) notFound();

  const padrino = beneficiario.padrinazgos[0]?.padrino.nombre;

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

      <Tarjeta className="max-w-3xl p-6 sm:p-8">
        <FormularioAvance
          accion={registrarAvance}
          beneficiarioId={beneficiario.id}
          hoy={fechaParaInput(new Date())}
        />
      </Tarjeta>
    </>
  );
}
