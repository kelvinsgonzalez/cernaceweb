import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  Campo,
  ChipDonacion,
  Tarjeta,
  TarjetaCabecera,
} from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha, formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { etiquetaMetodo, requiereBoleta } from "@/lib/pasarela";
import { aNumero, formatTamano } from "@/lib/utils";
import { reabrirDonacion, verificarDonacion } from "../acciones";

export const metadata: Metadata = { title: "Donación" };

export const dynamic = "force-dynamic";

export default async function DonacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.DONACIONES_LEER);
  const usuario = await usuarioActual();
  const puedeVerificar = tienePermiso(usuario, PERMISOS.DONACIONES_GESTIONAR);
  const abrePadrinos = tienePermiso(usuario, PERMISOS.PADRINOS_GESTIONAR);

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    include: {
      campaign: { select: { titulo: true } },
      padrino: { select: { id: true, nombre: true } },
    },
  });
  if (!donacion) notFound();

  const porBanco = requiereBoleta(donacion.metodo);
  const pendiente = donacion.estado === "PENDIENTE";
  const esImagen = (donacion.boletaTipoMime ?? "").startsWith("image/");
  const urlBoleta = `/api/boletas/${donacion.id}`;

  return (
    <>
      <Link
        href="/admin/donaciones"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a donaciones
      </Link>

      <EncabezadoPagina
        titulo={donacion.referenciaPasarela}
        descripcion={`${donacion.donanteNombre} · ${formatQuetzales(aNumero(donacion.monto))} ${donacion.moneda} · ${etiquetaMetodo(donacion.metodo)}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Datos del aporte" />
          <dl className="grid gap-5 p-5 sm:grid-cols-2">
            <Campo etiqueta="Estado">
              <ChipDonacion estado={donacion.estado} />
            </Campo>
            <Campo etiqueta="Recibida">
              {formatFechaHora(donacion.createdAt)}
            </Campo>
            <Campo etiqueta="Monto">
              {formatQuetzales(aNumero(donacion.monto))} {donacion.moneda}
            </Campo>
            <Campo etiqueta="Frecuencia">
              {donacion.recurrente ? "Mensual" : "Aporte único"}
            </Campo>
            <Campo etiqueta="Donante">{donacion.donanteNombre}</Campo>
            <Campo etiqueta="Correo">{donacion.donanteEmail}</Campo>
            <Campo etiqueta="Destino">
              {donacion.campaign?.titulo ?? "Donde más se necesite"}
            </Campo>
            <Campo etiqueta="Padrino">
              {!donacion.padrino ? (
                "—"
              ) : abrePadrinos ? (
                <Link
                  href={`/admin/donantes/${donacion.padrino.id}`}
                  className="font-semibold text-brand-dark hover:underline"
                >
                  {donacion.padrino.nombre}
                </Link>
              ) : (
                donacion.padrino.nombre
              )}
            </Campo>
            {donacion.mensaje ? (
              <div className="sm:col-span-2">
                <Campo etiqueta="Mensaje del donante">
                  <span className="medida-lectura block">{donacion.mensaje}</span>
                </Campo>
              </div>
            ) : null}
            {donacion.verificadaEn ? (
              <div className="sm:col-span-2 border-t border-line pt-5">
                <Campo etiqueta="Revisión">
                  {donacion.verificadaPor ?? "—"} ·{" "}
                  {formatFechaHora(donacion.verificadaEn)}
                  {donacion.notaVerificacion ? (
                    <span className="medida-lectura mt-1 block text-ink-soft">
                      {donacion.notaVerificacion}
                    </span>
                  ) : null}
                </Campo>
              </div>
            ) : null}
          </dl>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Boleta del banco" />
          {donacion.boletaArchivo ? (
            <div className="p-5">
              <dl className="grid gap-5 sm:grid-cols-2">
                <Campo etiqueta="Banco">{donacion.boletaBanco ?? "—"}</Campo>
                <Campo etiqueta="Número de boleta">
                  {donacion.boletaNumero ?? "—"}
                </Campo>
                <Campo etiqueta="Fecha del depósito">
                  {formatFecha(donacion.boletaFecha)}
                </Campo>
                <Campo etiqueta="Subida">
                  {formatFechaHora(donacion.boletaSubidaEn)}
                  <span className="block text-xs text-ink-soft">
                    {formatTamano(donacion.boletaTamanoBytes ?? 0)}
                  </span>
                </Campo>
              </dl>

              <div className="mt-5 rounded-[var(--radius-sm)] border border-line bg-canvas p-3">
                {esImagen ? (
                  <a href={urlBoleta} target="_blank" rel="noopener">
                    <Image
                      src={urlBoleta}
                      alt={`Boleta ${donacion.boletaNumero ?? ""} de ${donacion.boletaBanco ?? "el banco"}`}
                      width={900}
                      height={1200}
                      unoptimized
                      className="h-auto w-full rounded-[var(--radius-sm)] object-contain"
                    />
                  </a>
                ) : (
                  <p className="flex items-center gap-2 p-3 text-sm text-ink-soft">
                    <FileText aria-hidden="true" className="size-5 shrink-0" />
                    El comprobante llegó en PDF. Ábrelo para revisarlo.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <a
                  href={urlBoleta}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-brand-primary/45 bg-surface px-4 py-2.5 text-sm font-semibold text-brand-dark transition duration-300 ease-suave hover:border-brand-primary hover:bg-brand-sky"
                >
                  <Receipt aria-hidden="true" className="size-4" />
                  Abrir la boleta
                  <span className="visually-hidden">
                    {" "}
                    (se abre en una pestaña nueva)
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <p className="medida-lectura p-5 text-sm text-ink-soft">
              {porBanco
                ? "El donante todavía no ha subido su boleta. Puede hacerlo desde el enlace del comprobante que vio al terminar."
                : "Este aporte se cobró con tarjeta a través de la pasarela: no lleva boleta."}
            </p>
          )}
        </Tarjeta>
      </div>

      {puedeVerificar ? (
        <Tarjeta className="mt-6 overflow-hidden">
          <TarjetaCabecera
            titulo={pendiente ? "Verificar el aporte" : "Revisión hecha"}
          />
          <div className="p-5">
            {pendiente ? (
              <form action={verificarDonacion} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={donacion.id} />
                <p className="medida-lectura text-sm text-ink-soft">
                  Coteja la boleta contra el estado de cuenta antes de dar el
                  aporte por bueno: al aprobarlo entra en el total recaudado. Si
                  lo rechazas, la nota que escribas aquí es la que verá el
                  donante en su comprobante.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="notaVerificacion"
                    className="text-sm font-semibold text-ink"
                  >
                    Nota de la revisión (opcional)
                  </label>
                  <textarea
                    id="notaVerificacion"
                    name="notaVerificacion"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Boton
                    type="submit"
                    name="decision"
                    value="APROBAR"
                    className="px-6 py-3"
                  >
                    Dar por buena la donación
                  </Boton>
                  <Boton
                    type="submit"
                    name="decision"
                    value="RECHAZAR"
                    variante="peligro"
                    className="px-6 py-3"
                  >
                    Rechazar la boleta
                  </Boton>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="medida-lectura text-sm text-ink-soft">
                  {donacion.verificadaPor
                    ? `${donacion.verificadaPor} resolvió esta donación el ${formatFechaHora(donacion.verificadaEn)}`
                    : "Esta donación la resolvió la pasarela."}{" "}
                  Si hubo un error, devuélvela a pendiente y revísala de nuevo.
                </p>
                <form action={reabrirDonacion}>
                  <input type="hidden" name="id" value={donacion.id} />
                  <Boton type="submit" variante="contorno">
                    Devolver a pendiente
                  </Boton>
                </form>
              </div>
            )}
          </div>
        </Tarjeta>
      ) : null}
    </>
  );
}
