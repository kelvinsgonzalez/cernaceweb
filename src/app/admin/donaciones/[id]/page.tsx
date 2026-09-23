import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, MessageCircleHeart, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  Campo,
  Chip,
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
import { METODOS_PAGO, etiquetaMetodo } from "@/lib/pasarela";
import { esFotoIphone } from "@/lib/almacenamiento";
import { formatTamano } from "@/lib/utils";
import {
  alternarMensajeFamilia,
  reabrirDonacion,
  verificarDonacion,
} from "../acciones";

export const metadata: Metadata = { title: "Aporte" };

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = {
  APADRINAMIENTO: "Aporte de apadrinamiento",
  CAMPANA: "Aporte a campaña",
  GENERAL: "Aporte a lo que se necesite",
};

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

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    include: {
      campaign: { select: { titulo: true } },
      padrino: { select: { id: true, nombre: true, email: true } },
      beneficiario: {
        select: { id: true, codigoExpediente: true, nombres: true, apellidos: true },
      },
      usuario: { select: { nombre: true, email: true } },
    },
  });
  if (!donacion) notFound();

  const pendiente = donacion.estado === "PENDIENTE";
  const aprobada = donacion.estado === "COMPLETADA";
  // Un HEIC del iPhone es una imagen, pero solo Safari la pinta: se trata como
  // el PDF y se ofrece abrirla en vez de incrustarla rota.
  const tipoBoleta = donacion.boletaTipoMime ?? "";
  const esImagen = tipoBoleta.startsWith("image/") && !esFotoIphone(tipoBoleta);
  const urlBoleta = `/api/boletas/${donacion.id}`;

  // Para emparejar un aporte que llegó sin niño. Si viene de un padrino, sus
  // ahijados van primero: casi siempre es uno de ellos.
  const candidatos =
    puedeVerificar && pendiente && !donacion.beneficiarioId
      ? await prisma.beneficiario.findMany({
          where: { estado: "ACTIVO" },
          select: {
            id: true,
            codigoExpediente: true,
            nombres: true,
            apellidos: true,
            padrinazgos: donacion.padrinoId
              ? { where: { padrinoId: donacion.padrinoId, activo: true }, select: { id: true } }
              : false,
          },
          orderBy: { codigoExpediente: "asc" },
        })
      : [];
  const ahijados = candidatos.filter(
    (c) => Array.isArray(c.padrinazgos) && c.padrinazgos.length > 0,
  );
  const otros = candidatos.filter(
    (c) => !Array.isArray(c.padrinazgos) || c.padrinazgos.length === 0,
  );

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
          donacion.padrino?.nombre ?? donacion.donanteNombre ?? "Aporte sin identificar",
          formatMontoOpcional(donacion.monto),
          TIPOS[donacion.tipo] ?? donacion.tipo,
        ].join(" · ")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera titulo="Datos del aporte" />
          <dl className="grid gap-5 p-5 sm:grid-cols-2">
            <Campo etiqueta="Estado">
              <ChipDonacion estado={donacion.estado} />
            </Campo>
            <Campo etiqueta="Recibido">
              {formatFechaHora(donacion.createdAt)}
            </Campo>
            <Campo etiqueta="Monto">
              {donacion.monto === null ? (
                <span className="text-ink-soft">
                  Sin anotar — léelo en la foto
                </span>
              ) : (
                `${formatMontoOpcional(donacion.monto)} ${donacion.moneda}`
              )}
            </Campo>
            <Campo etiqueta="Método">{etiquetaMetodo(donacion.metodo)}</Campo>
            <Campo etiqueta="Padrino">
              {donacion.padrino ? (
                <Link
                  href={`/admin/donantes/${donacion.padrino.id}`}
                  className="font-semibold text-brand-dark hover:underline"
                >
                  {donacion.padrino.nombre}
                </Link>
              ) : (
                <span className="text-ink-soft">—</span>
              )}
            </Campo>
            <Campo etiqueta="De parte de">
              {donacion.donanteNombre ?? (
                <span className="text-ink-soft">Sin identificar</span>
              )}
              {donacion.donanteEmail ? (
                <span className="block text-xs text-ink-soft">
                  {donacion.donanteEmail}
                </span>
              ) : null}
            </Campo>
            <Campo etiqueta="Niño">
              {donacion.beneficiario ? (
                <Link
                  href={`/admin/beneficiarios/${donacion.beneficiario.id}`}
                  className="font-semibold text-brand-dark hover:underline"
                >
                  {donacion.beneficiario.nombres} {donacion.beneficiario.apellidos}
                  <span className="block font-mono text-xs font-normal text-ink-soft">
                    {donacion.beneficiario.codigoExpediente}
                  </span>
                </Link>
              ) : donacion.destinoNino ? (
                <>
                  <span>{donacion.destinoNino}</span>
                  <span className="block text-xs text-ink-soft">
                    Escrito por el donante, sin emparejar
                  </span>
                </>
              ) : (
                <span className="text-ink-soft">—</span>
              )}
            </Campo>
            <Campo etiqueta="Campaña">
              {donacion.campaign?.titulo ?? <span className="text-ink-soft">—</span>}
            </Campo>
            {donacion.usuario && !donacion.padrino ? (
              <Campo etiqueta="Cuenta que lo envió">
                {donacion.usuario.nombre}
                <span className="block text-xs text-ink-soft">
                  {donacion.usuario.email}
                </span>
              </Campo>
            ) : null}
            {donacion.notaVerificacion ? (
              <div className="sm:col-span-2">
                <Campo etiqueta={aprobada ? "Nota de la revisión" : "Mensaje al padrino"}>
                  <span className="medida-lectura block">
                    {donacion.notaVerificacion}
                  </span>
                </Campo>
              </div>
            ) : null}
            {donacion.verificadaPor ? (
              <div className="sm:col-span-2">
                <Campo etiqueta="Revisado por">
                  {donacion.verificadaPor} · {formatFechaHora(donacion.verificadaEn)}
                </Campo>
              </div>
            ) : null}
          </dl>

          {donacion.mensaje ? (
            <div className="border-t border-line p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <MessageCircleHeart aria-hidden="true" className="size-4 text-brand-primary" />
                Mensaje de amor
              </p>
              <blockquote className="medida-lectura mt-2 rounded-[var(--radius-sm)] bg-brand-sky p-4 text-sm text-brand-dark">
                {donacion.mensaje}
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {donacion.mensajeVisibleFamilia ? (
                  <Chip tono="ok">Publicado a la familia</Chip>
                ) : (
                  <Chip tono="neutro">Sin publicar</Chip>
                )}
                {puedeVerificar && aprobada ? (
                  <form action={alternarMensajeFamilia}>
                    <input type="hidden" name="id" value={donacion.id} />
                    <Boton type="submit" variante="contorno" className="px-3 py-1.5 text-xs">
                      {donacion.mensajeVisibleFamilia
                        ? "Retirar de Mi expediente"
                        : "Publicar a la familia"}
                    </Boton>
                  </form>
                ) : null}
              </div>
            </div>
          ) : null}
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera
            titulo="Comprobante"
            icono={<Receipt className="size-5" />}
          />
          {donacion.boletaArchivo ? (
            <div className="p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Subido">
                  {formatFechaHora(donacion.boletaSubidaEn)}
                </Campo>
                <Campo etiqueta="Archivo">
                  {donacion.boletaTipoMime}
                  {donacion.boletaTamanoBytes
                    ? ` · ${formatTamano(donacion.boletaTamanoBytes)}`
                    : ""}
                </Campo>
                {donacion.boletaBanco ? (
                  <Campo etiqueta="Banco">{donacion.boletaBanco}</Campo>
                ) : null}
                {donacion.boletaNumero ? (
                  <Campo etiqueta="Número">{donacion.boletaNumero}</Campo>
                ) : null}
                {donacion.boletaFecha ? (
                  <Campo etiqueta="Fecha de la boleta">
                    {formatFecha(donacion.boletaFecha)}
                  </Campo>
                ) : null}
              </dl>
              {esImagen ? (
                <a
                  href={urlBoleta}
                  target="_blank"
                  rel="noopener"
                  className="mt-5 block overflow-hidden rounded-[var(--radius-sm)] border border-line"
                >
                  <Image
                    src={urlBoleta}
                    alt={`Comprobante del aporte ${donacion.referenciaPasarela}`}
                    width={800}
                    height={1000}
                    unoptimized
                    className="h-auto w-full"
                  />
                  <span className="visually-hidden">(se abre en una pestaña nueva)</span>
                </a>
              ) : (
                <a
                  href={urlBoleta}
                  target="_blank"
                  rel="noopener"
                  className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-dark hover:underline"
                >
                  <FileText aria-hidden="true" className="size-5" />
                  Abrir el comprobante
                  <span className="visually-hidden">(se abre en una pestaña nueva)</span>
                </a>
              )}
            </div>
          ) : (
            <p className="medida-lectura p-5 text-sm text-ink-soft">
              Este aporte no trae comprobante. Los que entran por el sitio o el
              portal siempre lo traen, así que probablemente se registró a mano.
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
                  Coteja la foto contra el estado de cuenta antes de dar el
                  aporte por bueno: al aprobarlo entra en el total recaudado.
                  Si lo rechazas, el mensaje que escribas es el que verá quien
                  lo envió.
                </p>
                {falta === "monto" ? (
                  <p role="alert" className="rounded-[var(--radius-sm)] bg-bad-bg px-4 py-3 text-sm font-medium text-bad-fg">
                    Escribe el monto que ves en el comprobante antes de aprobar.
                  </p>
                ) : null}
                {falta === "nota" ? (
                  <p role="alert" className="rounded-[var(--radius-sm)] bg-bad-bg px-4 py-3 text-sm font-medium text-bad-fg">
                    Para rechazar, escribe el motivo: es lo que va a leer el padrino.
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="monto" className="text-sm font-semibold text-ink">
                      Monto del comprobante
                      <span className="ml-1 text-danger" aria-hidden="true">*</span>
                      <span className="visually-hidden">(obligatorio para aprobar)</span>
                    </label>
                    <p id="monto-ayuda" className="text-xs text-ink-soft">
                      En quetzales, tal como aparece en la foto.
                    </p>
                    <input
                      id="monto"
                      name="monto"
                      type="number"
                      min={1}
                      step="0.01"
                      defaultValue={donacion.monto === null ? "" : Number(donacion.monto)}
                      aria-describedby="monto-ayuda"
                      className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="metodo" className="text-sm font-semibold text-ink">
                      Método
                    </label>
                    <p id="metodo-ayuda" className="text-xs text-ink-soft">
                      Lo que se ve en el comprobante.
                    </p>
                    <select
                      id="metodo"
                      name="metodo"
                      defaultValue={donacion.metodo}
                      aria-describedby="metodo-ayuda"
                      className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                    >
                      {METODOS_PAGO.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!donacion.beneficiarioId ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="beneficiarioId" className="text-sm font-semibold text-ink">
                      ¿Va dirigido a un niño?
                    </label>
                    <p id="nino-ayuda" className="text-xs text-ink-soft">
                      Opcional. Si el donante lo indicó, empareja el aporte con
                      su expediente para que sume en el reporte por código.
                      {donacion.destinoNino ? ` El donante escribió: «${donacion.destinoNino}».` : ""}
                    </p>
                    <select
                      id="beneficiarioId"
                      name="beneficiarioId"
                      defaultValue={ahijados.length === 1 ? ahijados[0].id : ""}
                      aria-describedby="nino-ayuda"
                      className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                    >
                      <option value="">No, a la campaña o a lo que se necesite</option>
                      {ahijados.length > 0 ? (
                        <optgroup label="Sus ahijados">
                          {ahijados.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.codigoExpediente} · {c.nombres} {c.apellidos}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      <optgroup label="Todos los beneficiarios activos">
                        {otros.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.codigoExpediente} · {c.nombres} {c.apellidos}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ) : null}

                {donacion.mensaje ? (
                  <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line p-4 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="publicarMensaje"
                      value="si"
                      defaultChecked={Boolean(donacion.beneficiarioId)}
                      className="mt-0.5 size-4"
                    />
                    <span>
                      <span className="font-semibold">Publicar el mensaje de amor a la familia</span>
                      <span className="block text-xs text-ink-soft">
                        Al aprobar, la familia lo lee en Mi expediente. Sin la
                        casilla, el mensaje queda solo aquí.
                      </span>
                    </span>
                  </label>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notaVerificacion" className="text-sm font-semibold text-ink">
                    Mensaje para quien lo envió
                  </label>
                  <p id="nota-ayuda" className="text-xs text-ink-soft">
                    Obligatorio al rechazar: por ejemplo, «la foto no se lee» o
                    «el depósito no aparece en el estado de cuenta». Al aprobar
                    es opcional.
                  </p>
                  <textarea
                    id="notaVerificacion"
                    name="notaVerificacion"
                    rows={3}
                    maxLength={500}
                    aria-describedby="nota-ayuda"
                    className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Boton type="submit" name="decision" value="APROBAR" className="px-6 py-3">
                    Aprobar el aporte
                  </Boton>
                  <Boton
                    type="submit"
                    name="decision"
                    value="RECHAZAR"
                    variante="peligro"
                    className="px-6 py-3"
                  >
                    Rechazar con mensaje
                  </Boton>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="medida-lectura text-sm text-ink-soft">
                  {donacion.verificadaPor
                    ? `${donacion.verificadaPor} resolvió este aporte el ${formatFechaHora(donacion.verificadaEn)}.`
                    : "Este aporte quedó resuelto sin revisión manual."}{" "}
                  Si hubo un error, devuélvelo a pendiente y revísalo de nuevo.
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
