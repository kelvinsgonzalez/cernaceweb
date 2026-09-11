import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreditCard, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Boton, Campo, Tarjeta } from "@/components/ui";
import { formatQuetzales } from "@/lib/fechas";
import { etiquetaMetodo, pasarela } from "@/lib/pasarela";
import { aNumero } from "@/lib/utils";
import { confirmarDonacion } from "../../../acciones";

export const metadata: Metadata = {
  title: "Confirmar donación",
};

export const dynamic = "force-dynamic";

export default async function PagarPage({
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
  if (donacion.estado !== "PENDIENTE") redirect(`/donar/gracias/${donacion.id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        Confirma tu donación
      </h1>

      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Pasarela en modo prueba</p>
          <p className="medida-lectura mt-1 text-sm">
            {pasarela.nombre}. No hay cobro real y no se solicitan datos de
            tarjeta. Usa los botones de abajo para simular el resultado que
            devolvería la pasarela.
          </p>
        </div>
      </div>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <CreditCard aria-hidden="true" className="size-5 text-brand-primary" />
          Resumen del pago
        </h2>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Referencia">{donacion.referenciaPasarela}</Campo>
          <Campo etiqueta="Monto">
            {formatQuetzales(aNumero(donacion.monto))} {donacion.moneda}
          </Campo>
          <Campo etiqueta="Método">{etiquetaMetodo(donacion.metodo)}</Campo>
          <Campo etiqueta="Donante">{donacion.donanteNombre}</Campo>
          <Campo etiqueta="Correo">{donacion.donanteEmail}</Campo>
          <Campo etiqueta="Destino">
            {donacion.campaign?.titulo ?? "Donde más se necesite"}
          </Campo>
          <Campo etiqueta="Frecuencia">
            {donacion.recurrente ? "Mensual" : "Aporte único"}
          </Campo>
          <Campo etiqueta="Estado actual">Pendiente</Campo>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <form action={confirmarDonacion}>
            <input type="hidden" name="id" value={donacion.id} />
            <input type="hidden" name="aprobar" value="si" />
            <Boton type="submit" className="px-6 py-3">
              Simular pago aprobado
            </Boton>
          </form>
          <form action={confirmarDonacion}>
            <input type="hidden" name="id" value={donacion.id} />
            <input type="hidden" name="aprobar" value="no" />
            <Boton type="submit" variante="peligro" className="px-6 py-3">
              Simular pago rechazado
            </Boton>
          </form>
        </div>
      </Tarjeta>
    </div>
  );
}
