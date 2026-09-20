import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, HeartPulse } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { calcularEdad, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero, listarTerapias, primerNombre } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis apadrinados",
};

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  // La consulta parte del padrino de la sesión: nunca de un id de la URL.
  const padrinazgos = usuario.padrinoId
    ? await prisma.padrinazgo.findMany({
        where: { padrinoId: usuario.padrinoId, activo: true },
        include: {
          beneficiario: {
            select: {
              id: true,
              nombres: true,
              fechaNacimiento: true,
              terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
              _count: {
                select: { seguimientos: { where: { visibleParaPadrino: true } } },
              },
            },
          },
        },
        orderBy: { fechaInicio: "asc" },
      })
    : [];

  const aporteTotal = padrinazgos.reduce(
    (suma, p) => suma + aNumero(p.aporteMensual),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        Hola, {usuario.nombre.split(" ")[0]}
      </h1>
      <p className="medida-lectura mt-2 text-ink-soft">
        Aquí puedes seguir el progreso de{" "}
        {padrinazgos.length === 1
          ? "la persona que apadrinas"
          : "las personas que apadrinas"}
        . Los avances los publica el personal de CERNACE.
      </p>

      {padrinazgos.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Chip tono="info">
            {padrinazgos.length}{" "}
            {padrinazgos.length === 1 ? "apadrinamiento" : "apadrinamientos"}{" "}
            activo{padrinazgos.length === 1 ? "" : "s"}
          </Chip>
          <Chip tono="ok" icono={<HeartHandshake aria-hidden="true" className="size-4" />}>
            Aporte mensual: {formatQuetzales(aporteTotal)}
          </Chip>
        </div>
      ) : null}

      {padrinazgos.length === 0 ? (
        <Tarjeta className="mt-8">
          <Vacio mensaje="Todavía no tienes un beneficiario asignado. El equipo de CERNACE te avisará en cuanto se complete la asignación." />
        </Tarjeta>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {padrinazgos.map((padrinazgo) => {
            const nino = padrinazgo.beneficiario;
            const nombre = primerNombre(nino.nombres);
            return (
              <li key={padrinazgo.id}>
                <Tarjeta className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-heading text-xl font-bold text-brand-dark"
                    >
                      {nombre[0]}
                    </span>
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-ink">
                        {nombre}, {calcularEdad(nino.fechaNacimiento)} años
                      </h2>
                      <p className="mt-0.5 inline-flex items-center gap-2 text-sm text-brand-primary">
                        <HeartPulse aria-hidden="true" className="size-4 shrink-0" />
                        {listarTerapias(nino.terapias)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 grid flex-1 grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Aporte mensual
                      </dt>
                      <dd className="mt-1 text-ink">
                        {formatQuetzales(aNumero(padrinazgo.aporteMensual))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Desde
                      </dt>
                      <dd className="mt-1 text-ink">
                        {formatFecha(padrinazgo.fechaInicio)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Avances publicados
                      </dt>
                      <dd className="mt-1 text-ink">
                        {nino._count.seguimientos}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={`/portal/${nino.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
                  >
                    Ver progreso
                    <span className="visually-hidden">de {nombre}</span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
