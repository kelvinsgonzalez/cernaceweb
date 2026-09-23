import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, ChipDonacion, EnlaceBoton, Tarjeta, Vacio } from "@/components/ui";
import { formatFechaHora, formatMontoOpcional } from "@/lib/fechas";
import { primerNombre } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis aportes" };

export const dynamic = "force-dynamic";

export default async function MisAportesPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);
  const { enviado } = await searchParams;

  // Siempre desde el padrino de la sesión: nunca desde un id de la URL.
  const aportes = usuario.padrinoId
    ? await prisma.donacion.findMany({
        where: { padrinoId: usuario.padrinoId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          referenciaPasarela: true,
          estado: true,
          monto: true,
          moneda: true,
          mensaje: true,
          mensajeVisibleFamilia: true,
          notaVerificacion: true,
          beneficiario: { select: { id: true, nombres: true } },
          campaign: { select: { titulo: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        Mis aportes
      </h1>
      <p className="medida-lectura mt-2 text-ink-soft">
        Todo lo que has enviado, con su estado. El equipo revisa cada
        comprobante; cuando lo aprueba, aquí aparece el monto que anotó. Si lo
        rechaza, aquí lees por qué y puedes subir otra foto.
      </p>

      {enviado ? (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] bg-ok-bg p-5 text-ok-fg">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-medium">
            Recibimos tu comprobante con la referencia{" "}
            <span className="font-mono">{enviado}</span>. Queda pendiente hasta
            que el equipo lo revise. ¡Gracias!
          </p>
        </div>
      ) : null}

      {aportes.length === 0 ? (
        <Tarjeta className="mt-8">
          <Vacio mensaje="Todavía no has enviado ningún aporte. Desde la ficha de tu apadrinado puedes subir la foto de tu comprobante." />
        </Tarjeta>
      ) : (
        <ol className="mt-8 space-y-4">
          {aportes.map((aporte) => {
            const rechazado = aporte.estado === "FALLIDA";
            const aprobado = aporte.estado === "COMPLETADA";
            return (
              <li key={aporte.id}>
                <Tarjeta className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-ink-soft">{aporte.referenciaPasarela}</p>
                      <h2 className="mt-1 font-heading text-lg font-semibold text-ink">
                        {aporte.beneficiario
                          ? `Para ${primerNombre(aporte.beneficiario.nombres)}`
                          : (aporte.campaign?.titulo ?? "Aporte a lo que se necesite")}
                      </h2>
                      <p className="text-sm text-ink-soft">{formatFechaHora(aporte.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ChipDonacion estado={aporte.estado} />
                      {aprobado ? (
                        <p className="font-heading text-lg font-semibold text-ink">
                          {formatMontoOpcional(aporte.monto)} {aporte.moneda}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {aporte.mensaje ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Tu mensaje
                      </p>
                      <blockquote className="medida-lectura mt-1 text-sm text-ink">
                        {aporte.mensaje}
                      </blockquote>
                      {aprobado ? (
                        <Chip tono={aporte.mensajeVisibleFamilia ? "ok" : "neutro"} className="mt-2">
                          {aporte.mensajeVisibleFamilia
                            ? "Entregado a la familia"
                            : "En manos del equipo"}
                        </Chip>
                      ) : null}
                    </div>
                  ) : null}

                  {rechazado ? (
                    <div className="mt-4 rounded-[var(--radius-sm)] bg-bad-bg p-4 text-sm text-bad-fg">
                      <p className="font-semibold">Mensaje del equipo</p>
                      <p className="medida-lectura mt-1">
                        {aporte.notaVerificacion ?? "No se pudo dar por bueno el comprobante."}
                      </p>
                      {aporte.beneficiario ? (
                        <EnlaceBoton
                          href={`/portal/${aporte.beneficiario.id}/aportar`}
                          variante="contorno"
                          className="mt-3"
                        >
                          Subir otra foto
                        </EnlaceBoton>
                      ) : null}
                    </div>
                  ) : null}

                  {aporte.estado === "PENDIENTE" ? (
                    <p className="mt-4 text-sm text-ink-soft">
                      El equipo todavía no ha revisado este comprobante.
                    </p>
                  ) : null}
                </Tarjeta>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 text-sm">
        <Link href="/portal" className="font-semibold text-brand-dark hover:underline">
          Volver a mis apadrinados
        </Link>
      </p>
    </div>
  );
}
