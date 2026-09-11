import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Campo, ChipDonacion, EnlaceBoton, Tarjeta } from "@/components/ui";
import { formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { etiquetaMetodo } from "@/lib/pasarela";
import { aNumero } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Tarjeta className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
              aprobada ? "bg-ok-bg text-ok-fg" : "bg-bad-bg text-bad-fg"
            }`}
          >
            {aprobada ? (
              <CircleCheck className="size-6" />
            ) : (
              <CircleAlert className="size-6" />
            )}
          </span>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
              {aprobada ? "¡Gracias por tu donación!" : "El pago no se completó"}
            </h1>
            <p className="medida-lectura mt-2 text-ink-soft">
              {aprobada
                ? "La transacción quedó registrada en el sistema. Este es tu comprobante."
                : "La pasarela rechazó la transacción en modo prueba. Puedes intentarlo de nuevo cuando quieras."}
            </p>
          </div>
        </div>

        <h2 className="mt-8 font-heading text-lg font-semibold text-ink">
          Comprobante
        </h2>
        <dl className="mt-4 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <Campo etiqueta="Referencia">{donacion.referenciaPasarela}</Campo>
          <Campo etiqueta="Estado">
            <ChipDonacion estado={donacion.estado} />
          </Campo>
          <Campo etiqueta="Monto">
            {formatQuetzales(aNumero(donacion.monto))} {donacion.moneda}
          </Campo>
          <Campo etiqueta="Método">{etiquetaMetodo(donacion.metodo)}</Campo>
          <Campo etiqueta="Donante">{donacion.donanteNombre}</Campo>
          <Campo etiqueta="Correo">{donacion.donanteEmail}</Campo>
          <Campo etiqueta="Destino">
            {donacion.campaign?.titulo ?? "Donde más se necesite"}
          </Campo>
          <Campo etiqueta="Fecha">{formatFechaHora(donacion.createdAt)}</Campo>
        </dl>

        <p className="mt-6 rounded-[var(--radius-sm)] bg-warn-bg px-4 py-3 text-sm font-medium text-warn-fg">
          Comprobante emitido en modo prueba. No tiene validez fiscal.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <EnlaceBoton href="/" variante="contorno">
            Volver al inicio
          </EnlaceBoton>
          {aprobada ? (
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
