import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CalendarX2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { calcularEdad, fechaParaInput, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero, listarTerapias, primerNombre } from "@/lib/utils";
import {
  DIAS_CADUCA_PRONTO,
  diasEntre,
  necesitaAvisoAdmin,
  resumenesCompromisos,
} from "@/lib/aportes";
import { FormularioAsignacion } from "./formulario";
import {
  alternarAvances,
  asignarPadrinazgo,
  cambiarCaducidad,
  finalizarPadrinazgo,
  mantenerCompromiso,
} from "./acciones";

export const metadata: Metadata = { title: "Asignaciones" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Beneficiario",
  "Padrino",
  "Referencia",
  "Este mes",
  "Último aporte",
  "Caduca",
  "Avances",
  "Acción",
];

export default async function AsignacionesPage() {
  await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);
  const hoy = new Date();

  const [activos, sinPadrino, padrinos, ajuste] = await Promise.all([
    prisma.padrinazgo.findMany({
      where: { activo: true },
      include: {
        padrino: { select: { id: true, nombre: true, email: true, userId: true } },
        beneficiario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoExpediente: true,
            terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaInicio: "desc" },
    }),
    prisma.beneficiario.findMany({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
        fechaNacimiento: true,
        solicitaPatrocinio: true,
        publicadoEnGaleria: true,
        terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
      },
      orderBy: { fechaIngreso: "asc" },
    }),
    prisma.padrino.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        userId: true,
        _count: { select: { padrinazgos: { where: { activo: true } } } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.setting.findUnique({ where: { clave: "donaciones.aporteSugerido" } }),
  ]);

  const resumenes = await resumenesCompromisos(activos.map((p) => p.id), hoy);
  const conResumen = activos.map((p) => {
    const r = resumenes.get(p.id) ?? {
      aportadoMes: 0,
      totalAportado: 0,
      ultimoAporte: null,
    };
    const diasCaduca = p.caducaEl ? -diasEntre(hoy, p.caducaEl) : null;
    return {
      ...p,
      resumen: r,
      aviso: necesitaAvisoAdmin(r.ultimoAporte, p.fechaInicio, p.avisoAtendidoEl, hoy),
      // Días que faltan: negativo si ya pasó.
      diasParaCaducar: p.caducaEl ? diasEntre(hoy, p.caducaEl) : null,
      caducado: p.caducaEl ? p.caducaEl < hoy : false,
      caducaPronto:
        p.caducaEl && !(p.caducaEl < hoy) && diasEntre(hoy, p.caducaEl) <= DIAS_CADUCA_PRONTO,
      _diasCaduca: diasCaduca,
    };
  });

  const sinAportar = conResumen.filter((p) => p.aviso);
  const caducando = conResumen.filter((p) => p.caducado || p.caducaPronto);

  // Quienes pidieron patrocinador y todavía no se han publicado: sin la
  // autorización nadie los ve, así que nunca les llegará un padrino.
  const esperandoAutorizacion = sinPadrino.filter(
    (b) => b.solicitaPatrocinio && !b.publicadoEnGaleria,
  );

  const sinAsignacion = padrinos.filter((p) => p._count.padrinazgos === 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Asignaciones"
        descripcion="Vincula a un beneficiario con la cuenta de un padrino y fija su aporte mensual de referencia. En cuanto se asigna, el beneficiario sale de la galería pública y aparece en el portal de su padrino, que aporta desde su ficha."
      />

      <div className="grid gap-5 sm:grid-cols-4">
        <Kpi etiqueta="Apadrinamientos activos" valor={activos.length} />
        <Kpi etiqueta="Esperan padrino" valor={sinPadrino.length} />
        <Kpi etiqueta="Padrinos sin asignación" valor={sinAsignacion.length} />
        <Kpi
          etiqueta="Más de 6 meses sin aportar"
          valor={sinAportar.length}
          detalle="Esperan tu decisión"
        />
      </div>

      {sinAportar.length > 0 ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Más de seis meses sin aportar"
            descripcion="El padrino ya vio sus recordatorios en el portal. Decide tú: mantener el compromiso como está, o suspender los avances hasta que vuelva a aportar."
            icono={<BellRing className="size-5" />}
          />
          <ul className="divide-y divide-line">
            {sinAportar.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {p.padrino.nombre}{" "}
                    <span className="text-ink-soft">→</span>{" "}
                    <Link
                      href={`/admin/beneficiarios/${p.beneficiario.id}`}
                      className="text-brand-dark hover:underline"
                    >
                      {primerNombre(p.beneficiario.nombres)} {p.beneficiario.apellidos}
                    </Link>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {p.beneficiario.codigoExpediente} · último aporte:{" "}
                    {p.resumen.ultimoAporte
                      ? formatFecha(p.resumen.ultimoAporte)
                      : `ninguno desde ${formatFecha(p.fechaInicio)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={mantenerCompromiso}>
                    <input type="hidden" name="id" value={p.id} />
                    <Boton type="submit" variante="contorno" className="px-3 py-1.5 text-xs">
                      Mantener
                    </Boton>
                  </form>
                  {p.avancesSuspendidos ? (
                    <Chip tono="warn">Avances suspendidos</Chip>
                  ) : (
                    <form action={alternarAvances}>
                      <input type="hidden" name="id" value={p.id} />
                      <Boton type="submit" variante="peligro" className="px-3 py-1.5 text-xs">
                        Suspender avances
                      </Boton>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}

      {caducando.length > 0 ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Compromisos caducados o por caducar"
            descripcion="Nada pasa solo: el niño sigue asignado hasta que termines el compromiso o le quites la fecha."
            icono={<CalendarX2 className="size-5" />}
          />
          <ul className="divide-y divide-line">
            {caducando.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {p.padrino.nombre} → {primerNombre(p.beneficiario.nombres)}{" "}
                    {p.beneficiario.apellidos}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {p.caducado
                      ? `Caducó el ${formatFecha(p.caducaEl)}`
                      : `Caduca el ${formatFecha(p.caducaEl)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={cambiarCaducidad} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="date"
                      name="caducaEl"
                      defaultValue={fechaParaInput(p.caducaEl)}
                      aria-label="Nueva fecha de caducidad"
                      className="rounded-[var(--radius-sm)] border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                    />
                    <Boton type="submit" variante="contorno" className="px-3 py-1.5 text-xs">
                      Cambiar
                    </Boton>
                  </form>
                  <form action={cambiarCaducidad}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="caducaEl" value="" />
                    <Boton type="submit" variante="suave" className="px-3 py-1.5 text-xs">
                      Quitar fecha
                    </Boton>
                  </form>
                  <form action={finalizarPadrinazgo}>
                    <input type="hidden" name="id" value={p.id} />
                    <Boton type="submit" variante="peligro" className="px-3 py-1.5 text-xs">
                      Terminar
                    </Boton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}

      {esperandoAutorizacion.length > 0 ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Piden patrocinador y no están publicados"
            descripcion="La familia lo pidió pero falta la autorización de la administración, así que no aparecen en la página pública y nadie puede ofrecerse a apadrinarlos."
          />
          <ul className="divide-y divide-line">
            {esperandoAutorizacion.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <Link
                    href={`/admin/beneficiarios/${b.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {primerNombre(b.nombres)} {b.apellidos}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    {b.codigoExpediente} · {calcularEdad(b.fechaNacimiento)} años ·{" "}
                    {listarTerapias(b.terapias)}
                  </span>
                </div>
                <Chip tono="warn">Falta autorizar</Chip>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}

      <Tarjeta className="mt-8">
        <TarjetaCabecera
          titulo="Nueva asignación"
          descripcion="Solo aparecen beneficiarios activos que no tengan ya un padrino."
        />
        <div className="p-5">
          <FormularioAsignacion
            accion={asignarPadrinazgo}
            aporteSugerido={ajuste?.valor ?? "350"}
            hoy={fechaParaInput(hoy)}
            beneficiarios={sinPadrino.map((b) => ({
              id: b.id,
              etiqueta: `${b.nombres} ${b.apellidos} · ${calcularEdad(b.fechaNacimiento)} años · ${listarTerapias(b.terapias)}`,
            }))}
            padrinos={padrinos.map((p) => ({
              id: p.id,
              etiqueta: `${p.nombre} · ${p.email}${p.userId ? "" : " (sin acceso al portal)"}`,
            }))}
          />
        </div>
      </Tarjeta>

      <div className="mt-8">
        <h2 className="mb-4 font-heading text-xl font-semibold text-ink">
          Apadrinamientos activos
        </h2>
        <Tabla
          caption="Beneficiarios con un padrino asignado actualmente, con su aporte de referencia, lo aportado este mes y su último aporte"
          columnas={COLUMNAS}
        >
          {conResumen.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="Todavía no hay ningún beneficiario asignado."
            />
          ) : (
            conResumen.map((p) => (
              <Fila key={p.id}>
                <Celda>
                  <Link
                    href={`/admin/beneficiarios/${p.beneficiario.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {primerNombre(p.beneficiario.nombres)} {p.beneficiario.apellidos}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    {p.beneficiario.codigoExpediente}
                  </span>
                </Celda>
                <Celda>
                  <Link
                    href={`/admin/donantes/${p.padrino.id}`}
                    className="block text-brand-dark hover:underline"
                  >
                    {p.padrino.nombre}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    desde {formatFecha(p.fechaInicio)}
                  </span>
                  {p.padrino.userId ? null : (
                    <Chip tono="warn" className="mt-1">
                      Sin acceso al portal
                    </Chip>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatQuetzales(aNumero(p.aporteMensual))}
                  <span className="block text-xs text-ink-soft">al mes</span>
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatQuetzales(p.resumen.aportadoMes)}
                  <span className="block text-xs text-ink-soft">
                    total {formatQuetzales(p.resumen.totalAportado)}
                  </span>
                </Celda>
                <Celda className="whitespace-nowrap">
                  {p.resumen.ultimoAporte ? (
                    formatFecha(p.resumen.ultimoAporte)
                  ) : (
                    <span className="text-ink-soft">Ninguno</span>
                  )}
                  {p.aviso ? (
                    <Chip tono="warn" className="mt-1">
                      +6 meses
                    </Chip>
                  ) : null}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {p.caducaEl ? (
                    <>
                      {formatFecha(p.caducaEl)}
                      {p.caducado ? (
                        <Chip tono="bad" className="mt-1">Caducado</Chip>
                      ) : p.caducaPronto ? (
                        <Chip tono="warn" className="mt-1">Pronto</Chip>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-soft">Sin fecha</span>
                  )}
                </Celda>
                <Celda>
                  <form action={alternarAvances}>
                    <input type="hidden" name="id" value={p.id} />
                    <Boton
                      type="submit"
                      variante={p.avancesSuspendidos ? "contorno" : "suave"}
                      className="px-3 py-1.5 text-xs"
                    >
                      {p.avancesSuspendidos ? "Reactivar" : "Suspender"}
                      <span className="visually-hidden">
                        {" "}los avances de {primerNombre(p.beneficiario.nombres)} para {p.padrino.nombre}
                      </span>
                    </Boton>
                  </form>
                  {p.avancesSuspendidos ? (
                    <span className="mt-1 block text-xs text-warn-fg">Suspendidos</span>
                  ) : null}
                </Celda>
                <Celda>
                  <form action={finalizarPadrinazgo}>
                    <input type="hidden" name="id" value={p.id} />
                    <Boton type="submit" variante="contorno" className="px-3 py-1.5 text-xs">
                      Finalizar
                      <span className="visually-hidden">
                        el apadrinamiento de{" "}
                        {primerNombre(p.beneficiario.nombres)} por{" "}
                        {p.padrino.nombre}
                      </span>
                    </Boton>
                  </form>
                </Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>
    </>
  );
}
