import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck, Clock3, Heart, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Campo, ChipDonacion, EnlaceBoton, Tarjeta } from "@/components/ui";
import { formatFechaHora, formatMontoOpcional } from "@/lib/fechas";
import { etiquetaMetodo, requiereBoleta } from "@/lib/pasarela";

export const metadata: Metadata = {
  title: "Comprobante de donación",
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
    include: { campaign: { select: { titulo: true } } },
  });

  if (!donacion) notFound();

  const aprobada = donacion.estado === "COMPLETADA";
  const enRevision = donacion.estado === "PENDIENTE";
  const porBanco = requiereBoleta(donacion.metodo);
  const conBoleta = Boolean(donacion.boletaArchivo);

  const titulo = aprobada
    ? "¡Gracias por tu donación!"
    : enRevision
      ? conBoleta
        ? "¡Gracias por tu donativo!"
        : "Tu donación está pendiente"
      : "El pago no se completó";

  const explicacion = aprobada
    ? "La transacción quedó registrada en el sistema. Este es tu comprobante."
    : enRevision
      ? conBoleta
        ? "Recibimos tu boleta y ya está en manos del equipo. La cotejaremos contra el estado de cuenta para dar el aporte por bueno. Gracias por sostener el trabajo del centro."
        : "Todavía no recibimos el comprobante del depósito."
      : porBanco
        ? "El equipo no pudo dar por buena esta boleta. Si crees que es un error, escríbenos con la referencia a la vista."
        : "La pasarela rechazó la transacción en modo prueba. Puedes intentarlo de nuevo cuando quieras.";

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
                  ? conBoleta
                    ? "bg-brand-sky text-brand-primary"
                    : "bg-warn-bg text-warn-fg"
                  : "bg-bad-bg text-bad-fg"
            }`}
          >
            {aprobada ? (
              <CircleCheck className="size-6" />
            ) : enRevision ? (
              conBoleta ? (
                <Heart className="size-6" />
              ) : (
                <Clock3 className="size-6" />
              )
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
              ? "Lo toma el equipo de tu boleta"
              : `${formatMontoOpcional(donacion.monto)} ${donacion.moneda}`}
          </Campo>
          <Campo etiqueta="Método">{etiquetaMetodo(donacion.metodo)}</Campo>
          <Campo etiqueta="Destino">
            {donacion.destinoNino ??
              donacion.campaign?.titulo ??
              "Donde más se necesite"}
          </Campo>
          <Campo etiqueta="Fecha">{formatFechaHora(donacion.createdAt)}</Campo>
        </dl>

        {!aprobada && !enRevision && donacion.notaVerificacion ? (
          <p className="medida-lectura mt-6 rounded-[var(--radius-sm)] bg-bad-bg px-4 py-3 text-sm font-medium text-bad-fg">
            Nota del equipo: {donacion.notaVerificacion}
          </p>
        ) : null}

        <p className="mt-6 rounded-[var(--radius-sm)] bg-warn-bg px-4 py-3 text-sm font-medium text-warn-fg">
          Comprobante emitido en modo prueba. No tiene validez fiscal.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <EnlaceBoton href="/" variante="contorno">
            Volver al inicio
          </EnlaceBoton>
          {aprobada || (enRevision && conBoleta) ? (
            <EnlaceBoton href="/apadrina" variante="suave">
              <Printer aria-hidden="true" className="size-4" />
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
