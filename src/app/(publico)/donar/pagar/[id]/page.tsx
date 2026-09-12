import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Building2, CreditCard, Receipt, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Boton, Campo, Tarjeta } from "@/components/ui";
import { FormularioBoleta } from "@/components/formularios-publicos";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { fechaParaInput, formatQuetzales } from "@/lib/fechas";
import {
  CLAVES_CUENTA,
  CUENTA_PREDETERMINADA,
  etiquetaMetodo,
  pasarela,
  requiereBoleta,
} from "@/lib/pasarela";
import { aNumero } from "@/lib/utils";
import { confirmarDonacion, subirBoleta } from "../../../acciones";

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

  const porBanco = requiereBoleta(donacion.metodo);

  // La cuenta a la que se deposita sale de Configuración; si todavía no está
  // cargada se usan los valores por defecto, para no dejar la página coja.
  const ajustes = porBanco
    ? await prisma.setting.findMany({
        where: { clave: { in: [...CLAVES_CUENTA] } },
        select: { clave: true, valor: true },
      })
    : [];
  const cuenta = (clave: string) =>
    ajustes.find((a) => a.clave === clave)?.valor ??
    CUENTA_PREDETERMINADA[clave];

  const resumen = (
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
  );

  if (porBanco) {
    const yaSubida = Boolean(donacion.boletaArchivo);

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
          {yaSubida ? "Tu boleta está en revisión" : "Deposita y sube tu boleta"}
        </h1>
        <p className="medida-lectura mt-2 text-ink-soft">
          Guarda la referencia{" "}
          <strong className="font-mono text-ink">
            {donacion.referenciaPasarela}
          </strong>
          : con ella el equipo localiza tu aporte.
        </p>

        <Tarjeta className="mt-6 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Building2 aria-hidden="true" className="size-5 text-brand-primary" />
            Cuenta para el depósito
          </h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Banco">{cuenta("donaciones.banco")}</Campo>
            <Campo etiqueta="Tipo de cuenta">
              {cuenta("donaciones.cuentaTipo")}
            </Campo>
            <Campo etiqueta="Número de cuenta">
              <span className="font-mono">{cuenta("donaciones.cuentaNumero")}</span>
            </Campo>
            <Campo etiqueta="A nombre de">
              {cuenta("donaciones.cuentaTitular")}
            </Campo>
            <Campo etiqueta="Monto a depositar">
              {formatQuetzales(aNumero(donacion.monto))} {donacion.moneda}
            </Campo>
            <Campo etiqueta="Concepto">{donacion.referenciaPasarela}</Campo>
          </dl>
        </Tarjeta>

        <Tarjeta className="mt-6 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Receipt aria-hidden="true" className="size-5 text-brand-primary" />
            {yaSubida ? "Reemplazar la boleta" : "Sube tu boleta"}
          </h2>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            {yaSubida
              ? "Ya recibimos una boleta para esta donación. Si te equivocaste de archivo o la foto salió borrosa, puedes subir otra mientras el equipo no la haya revisado."
              : "Tu donación queda pendiente hasta que el equipo coteje la boleta contra el estado de cuenta. Te avisamos al correo que dejaste."}
          </p>

          <div className="mt-6">
            <FormularioBoleta
              accion={subirBoleta}
              donacionId={donacion.id}
              tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
              valores={
                yaSubida
                  ? {
                      banco: donacion.boletaBanco ?? "",
                      numero: donacion.boletaNumero ?? "",
                      fecha: fechaParaInput(donacion.boletaFecha),
                    }
                  : undefined
              }
            />
          </div>
        </Tarjeta>

        <Tarjeta className="mt-6 p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Resumen de tu aporte
          </h2>
          {resumen}
        </Tarjeta>
      </div>
    );
  }

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

        {resumen}

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
