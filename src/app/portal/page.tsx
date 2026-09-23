import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandCoins, HeartHandshake, HeartPulse, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, EnlaceBoton, Tarjeta, Vacio } from "@/components/ui";
import { AvisoCampanas } from "@/components/aviso-campanas";
import { calcularEdad, formatFecha } from "@/lib/fechas";
import { listarTerapias, primerNombre } from "@/lib/utils";
import { recordatorioPara, resumenesCompromisos } from "@/lib/aportes";

export const metadata: Metadata = {
  title: "Mis apadrinados",
};

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);
  const hoy = new Date();

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

  const resumenes = await resumenesCompromisos(padrinazgos.map((p) => p.id), hoy);
  const tarjetas = padrinazgos.map((p) => {
    const resumen = resumenes.get(p.id);
    return {
      ...p,
      recordatorio: recordatorioPara(resumen?.ultimoAporte ?? null, p.fechaInicio, hoy),
      ultimoAporte: resumen?.ultimoAporte ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AvisoCampanas className="mb-6" />

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        Hola, {usuario.nombre.split(" ")[0]}
      </h1>
      <p className="medida-lectura mt-2 text-ink-soft">
        Aquí puedes seguir el progreso de{" "}
        {padrinazgos.length === 1
          ? "la persona que apadrinas"
          : "las personas que apadrinas"}{" "}
        y aportar desde su ficha. Los avances los publica el personal de CERNACE.
      </p>

      {padrinazgos.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Chip tono="info">
            {padrinazgos.length}{" "}
            {padrinazgos.length === 1 ? "apadrinamiento" : "apadrinamientos"}{" "}
            activo{padrinazgos.length === 1 ? "" : "s"}
          </Chip>
          <EnlaceBoton href="/portal/aportes" variante="contorno" className="px-3 py-1.5 text-xs">
            <HandCoins aria-hidden="true" className="size-4" />
            Mis aportes
          </EnlaceBoton>
        </div>
      ) : null}

      {padrinazgos.length === 0 ? (
        <Tarjeta className="mt-8">
          <Vacio mensaje="Todavía no tienes un beneficiario asignado. El equipo de CERNACE te avisará en cuanto se complete la asignación." />
        </Tarjeta>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {tarjetas.map((padrinazgo) => {
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

                  {padrinazgo.recordatorio ? (
                    <div
                      role="status"
                      className="mt-5 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-4 text-sm text-brand-dark"
                    >
                      {padrinazgo.recordatorio.nivel === "FUERTE" ? (
                        <HeartHandshake aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                      ) : (
                        <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                      )}
                      <span>
                        <span className="font-semibold">
                          «{padrinazgo.recordatorio.texto}»
                        </span>
                        <span className="block text-xs">— {nombre}</span>
                      </span>
                    </div>
                  ) : null}

                  <dl className="mt-5 grid flex-1 grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Apadrinas desde
                      </dt>
                      <dd className="mt-1 text-ink">
                        {formatFecha(padrinazgo.fechaInicio)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Tu último aporte
                      </dt>
                      <dd className="mt-1 text-ink">
                        {padrinazgo.ultimoAporte
                          ? formatFecha(padrinazgo.ultimoAporte)
                          : "Todavía ninguno"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Avances publicados
                      </dt>
                      <dd className="mt-1 text-ink">
                        {padrinazgo.avancesSuspendidos ? "—" : nino._count.seguimientos}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <EnlaceBoton href={`/portal/${nino.id}/aportar`} className="px-4 py-2 text-sm">
                      Aportar
                      <span className="visually-hidden"> para {nombre}</span>
                    </EnlaceBoton>
                    <Link
                      href={`/portal/${nino.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
                    >
                      Ver progreso
                      <span className="visually-hidden">de {nombre}</span>
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
