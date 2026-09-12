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
import {
  formatFecha,
  formatFechaHora,
  formatMontoOpcional,
} from "@/lib/fechas";
import { etiquetaMetodo, requiereBoleta } from "@/lib/pasarela";
import { esFotoIphone } from "@/lib/almacenamiento";
import { formatTamano } from "@/lib/utils";
import { reabrirDonacion, verificarDonacion } from "../acciones";

export const metadata: Metadata = { title: "Donación" };

export const dynamic = "force-dynamic";

export default async function DonacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ falta?: string }>;
}) {
  const { id } = await params;
  const { falta } = await searchParams;
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
  // Un HEIC del iPhone es una imagen, pero solo Safari la pinta: se trata como
  // el PDF y se ofrece abrirla en vez de incrustarla rota.
  const tipoBoleta = donacion.boletaTipoMime ?? "";
  const esImagen = tipoBoleta.startsWith("image/") && !esFotoIphone(tipoBoleta);
  const datosDeBoleta = Boolean(
    donacion.boletaBanco || donacion.boletaNumero || donacion.boletaFecha,
  );
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
        descripcion={[
          donacion.donanteNombre ?? "Donativo sin identificar",
          formatMontoOpcional(donacion.monto),
          etiquetaMetodo(donacion.metodo),
        ].join(" · ")}
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
              {donacion.monto === null ? (
                <span className="text-ink-soft">
                  Sin anotar — léelo en la boleta
                </span>
              ) : (
                `${formatMontoOpcional(donacion.monto)} ${donacion.moneda}`
              )}
            </Campo>
            <Campo etiqueta="Frecuencia">
              {donacion.recurrente ? "Mensual" : "Aporte único"}
            </Campo>
            <Campo etiqueta="Donante">
              {donacion.donanteNombre ?? (
                <span className="text-ink-soft">Sin identificar</span>
              )}
            </Campo>
            <Campo etiqueta="Correo">
              {donacion.donanteEmail ?? (
                <span className="text-ink-soft">—</span>
              )}
            </Campo>
            <Campo etiqueta="Niño indicado por el donante">
              {donacion.destinoNino ?? <span className="text-ink-soft">—</span>}
            </Campo>
            <Campo etiqueta="Campaña">
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
                {/* Banco, número y fecha ya no se piden al donar: están en la
                    imagen. Solo los traen los aportes registrados antes. */}
                {datosDeBoleta ? (
                  <>
                    <Campo etiqueta="Banco">{donacion.boletaBanco ?? "—"}</Campo>
                    <Campo etiqueta="Número de boleta">
                      {donacion.boletaNumero ?? "—"}
                    </Campo>
                    <Campo etiqueta="Fecha del depósito">
                      {formatFecha(donacion.boletaFecha)}
                    </Campo>
                  </>
                ) : null}
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
                      alt={`Boleta del aporte ${donacion.referenciaPasarela}`}
                      width={900}
                      height={1200}
                      unoptimized
                      className="h-auto w-full rounded-[var(--radius-sm)] object-contain"
                    />
                  </a>
                ) : (
                  <p className="flex items-center gap-2 p-3 text-sm text-ink-soft">
                    <FileText aria-hidden="true" className="size-5 shrink-0" />
                    {esFotoIphone(tipoBoleta)
                      ? "El comprobante llegó como foto HEIC de iPhone. Ábrela para revisarla."
                      : "El comprobante llegó en PDF. Ábrelo para revisarlo."}
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
                ? "Este aporte se registró sin boleta. Los donativos que entran por el sitio siempre la traen, así que probablemente se anotó a mano."
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
                {falta === "monto" ? (
                  <p
                    role="alert"
                    className="rounded-[var(--radius-sm)] bg-bad-bg px-4 py-3 text-sm font-medium text-bad-fg"
                  >
                    Escribe el monto de la boleta antes de dar el aporte por
                    bueno.
                  </p>
                ) : null}
                {donacion.monto === null ? (
                  // El donativo directo llega sin monto: quien deposita no lo
                  // declara. Sin anotarlo aquí, el aporte sumaría cero al total.
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="monto"
                      className="text-sm font-semibold text-ink"
                    >
                      Monto de la boleta
                      <span className="ml-1 text-danger" aria-hidden="true">
                        *
                      </span>
                      <span className="visually-hidden">(obligatorio)</span>
                    </label>
                    <p id="monto-ayuda" className="text-xs text-ink-soft">
                      En quetzales, tal como aparece en el comprobante. Hace
                      falta para aprobar el aporte.
                    </p>
                    <input
                      id="monto"
                      name="monto"
                      type="number"
                      min={1}
                      step="0.01"
                      aria-describedby="monto-ayuda"
                      className="max-w-xs rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                    />
                  </div>
                ) : null}
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
