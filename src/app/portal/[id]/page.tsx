import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { calcularEdad, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero, primerNombre } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProgresoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  // La consulta exige que el padrinazgo pertenezca a este padrino: un id
  // ajeno en la URL no devuelve nada.
  const padrinazgo = usuario.padrinoId
    ? await prisma.padrinazgo.findFirst({
        where: {
          beneficiarioId: id,
          padrinoId: usuario.padrinoId,
          activo: true,
        },
        include: {
          beneficiario: {
            select: {
              id: true,
              nombres: true,
              fechaNacimiento: true,
              fechaIngreso: true,
              programa: { select: { nombre: true, descripcion: true, icono: true } },
              // Solo los avances marcados como visibles para el padrino.
              seguimientos: {
                where: { visibleParaPadrino: true },
                orderBy: { fecha: "desc" },
                select: {
                  id: true,
                  fecha: true,
                  area: true,
                  titulo: true,
                  descripcion: true,
                },
              },
            },
          },
        },
      })
    : null;

  if (!padrinazgo) notFound();

  const nino = padrinazgo.beneficiario;
  const nombre = primerNombre(nino.nombres);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "VER_PORTAL",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.id,
    detalle: `Consulta del progreso de ${nombre} desde el portal del padrino`,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a mis apadrinados
      </Link>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <span
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-brand-yellow font-heading text-2xl font-bold text-brand-dark"
          >
            {nombre[0]}
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink">
              {nombre}, {calcularEdad(nino.fechaNacimiento)} años
            </h1>
            <p className="mt-1 inline-flex items-center gap-2 text-brand-primary">
              <IconoPrograma nombre={nino.programa.icono} className="size-4" />
              {nino.programa.nombre}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              En CERNACE desde
            </dt>
            <dd className="mt-1 text-sm text-ink">{formatFecha(nino.fechaIngreso)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Tu aporte mensual
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatQuetzales(aNumero(padrinazgo.aporteMensual))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Apadrinas desde
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatFecha(padrinazgo.fechaInicio)}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      <section aria-labelledby="avances-titulo" className="mt-8">
        <h2 id="avances-titulo" className="font-heading text-2xl font-bold text-ink">
          Avances publicados
        </h2>
        <p className="medida-lectura mt-2 text-sm text-ink-soft">
          El personal decide qué avances se comparten contigo. Las notas
          internas del expediente no aparecen aquí.
        </p>

        {nino.seguimientos.length === 0 ? (
          <Tarjeta className="mt-5">
            <Vacio mensaje="Todavía no hay avances publicados. En cuanto el equipo registre uno, aparecerá en esta página." />
          </Tarjeta>
        ) : (
          <ol className="mt-5 space-y-4">
            {nino.seguimientos.map((avance) => (
              <li key={avance.id}>
                <Tarjeta className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Chip
                      tono="info"
                      icono={<CalendarDays aria-hidden="true" className="size-4" />}
                    >
                      {formatFecha(avance.fecha)}
                    </Chip>
                    <Chip tono="neutro">{avance.area}</Chip>
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-semibold text-ink">
                    {avance.titulo}
                  </h3>
                  <p className="medida-lectura mt-2 text-sm text-ink-soft">
                    {avance.descripcion}
                  </p>
                </Tarjeta>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-5">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-dark"
        />
        <p className="medida-lectura text-sm text-brand-dark">
          Como padrino ves el nombre, la edad, el programa y los avances
          publicados. El diagnóstico, la ficha socioeconómica y los datos de la
          familia son confidenciales y no se comparten.
        </p>
      </div>
    </div>
  );
}
