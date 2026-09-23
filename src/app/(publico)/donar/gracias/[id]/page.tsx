import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Campo, ChipDonacion, EnlaceBoton, Tarjeta } from "@/components/ui";
import { formatFechaHora, formatMontoOpcional } from "@/lib/fechas";
import { etiquetaMetodo } from "@/lib/pasarela";

export const metadata: Metadata = {
  title: "Comprobante de aporte",
};

export const dynamic = "force-dynamic";

export default async function GraciasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donacion = await prisma.donacion.findUnique({
    where: { id },
    include: {
      campaign: { select: { titulo: true } },
      beneficiario: { select: { codigoExpediente: true } },
    },
  });

  if (!donacion) notFound();

  const aprobada = donacion.estado === "COMPLETADA";
  const enRevision = donacion.estado === "PENDIENTE";

  const titulo = aprobada
    ? "¡Gracias por tu aporte!"
    : enRevision
      ? "¡Recibimos tu comprobante!"
      : "El aporte no se pudo dar por bueno";

  const explicacion = aprobada
    ? "El equipo ya cotejó tu comprobante y el aporte quedó registrado. Este es tu comprobante."
    : enRevision
      ? "Ya está en manos del equipo. Lo cotejaremos contra el estado de cuenta para darlo por bueno. Gracias por sostener el trabajo del centro."
      : "El equipo no pudo dar por buena la foto. Si crees que es un error, escríbenos con la referencia a la vista.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Tarjeta className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
              aprobada
                ? "bg-ok-bg text-ok-fg"
                : enRevision
                  ? "bg-brand-sky text-brand-primary"
                  : "bg-bad-bg text-bad-fg"
            }`}
          >
            {aprobada ? (
              <CircleCheck className="size-6" />
            ) : enRevision ? (
              <Heart className="size-6" />
            ) : (
              <CircleAlert className="size-6" />
            )}
          </span>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
              {titulo}
            </h1>
            <p className="medida-lectura mt-2 text-ink-soft">{explicacion}</p>
          </div>
        </div>

        <h2 className="mt-8 font-heading text-lg font-semibold text-ink">
          Comprobante
        </h2>
        <p className="medida-lectura mt-2 text-sm text-ink-soft">
          Guarda la referencia{" "}
          <strong className="font-mono text-ink">
            {donacion.referenciaPasarela}
          </strong>
          : es con lo que el equipo localiza tu aporte si necesitas escribirnos.
        </p>
        <dl className="mt-4 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <Campo etiqueta="Referencia">{donacion.referenciaPasarela}</Campo>
          <Campo etiqueta="Estado">
            <ChipDonacion estado={donacion.estado} />
          </Campo>
          <Campo etiqueta="Monto">
            {donacion.monto === null
              ? "Lo toma el equipo de tu comprobante"
              : `${formatMontoOpcional(donacion.monto)} ${donacion.moneda}`}
          </Campo>
          <Campo etiqueta="Método">{etiquetaMetodo(donacion.metodo)}</Campo>
          <Campo etiqueta="Destino">
            {donacion.beneficiario
              ? `Expediente ${donacion.beneficiario.codigoExpediente}`
              : (donacion.campaign?.titulo ?? "Aportar a lo que se necesite")}
          </Campo>
          <Campo etiqueta="Fecha">{formatFechaHora(donacion.createdAt)}</Campo>
        </dl>

        {!aprobada && !enRevision && donacion.notaVerificacion ? (
          <p className="medida-lectura mt-6 rounded-[var(--radius-sm)] bg-bad-bg px-4 py-3 text-sm font-medium text-bad-fg">
            Nota del equipo: {donacion.notaVerificacion}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <EnlaceBoton href="/" variante="contorno">
            Volver al inicio
          </EnlaceBoton>
          {aprobada || enRevision ? (
            <EnlaceBoton href="/apadrina" variante="suave">
              Conocer a quiénes apoyas
            </EnlaceBoton>
          ) : (
            <EnlaceBoton href="/donar">Intentar de nuevo</EnlaceBoton>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
