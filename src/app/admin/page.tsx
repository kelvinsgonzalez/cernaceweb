import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BellRing,
  FolderOpen,
  HandCoins,
  Inbox,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSesion, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { modulosVisibles } from "@/lib/navegacion";
import { Chip, Kpi, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha, formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import {
  DIAS_CADUCA_PRONTO,
  diasEntre,
  necesitaAvisoAdmin,
  resumenesCompromisos,
} from "@/lib/aportes";

export const metadata: Metadata = { title: "Panel" };

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const usuario = await requireSesion();

  // Quien no tiene panel general aterriza en su primer módulo: el enlace de
  // inicio del menú y /inicio siguen apuntando aquí, así que no hay callejón.
  if (!tienePermiso(usuario, PERMISOS.PANEL_VER)) {
    const primero = modulosVisibles(usuario.permisos).find((m) => m.href !== "/admin");
    redirect(primero?.href ?? "/sin-acceso");
  }

  const puedeVerDonaciones = tienePermiso(usuario, PERMISOS.DONACIONES_LEER);
  const puedeVerAuditoria = tienePermiso(usuario, PERMISOS.AUDITORIA_LEER);
  const puedeVerSolicitudes = tienePermiso(usuario, PERMISOS.SOLICITUDES_ATENDER);

  const [
    totalBeneficiarios,
    conPadrino,
    incompletos,
    solicitudesNuevas,
    casosAsignados,
    ultimosAvances,
  ] = await Promise.all([
    prisma.beneficiario.count({ where: { estado: "ACTIVO" } }),
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { some: { activo: true } } },
    }),
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", estadoExpediente: { not: "COMPLETO" } },
    }),
    // Solo se consulta la bandeja pública si el rol la atiende.
    puedeVerSolicitudes
      ? prisma.supportRequest.count({ where: { estado: "NUEVA" } })
      : 0,
    prisma.asignacionTerapeuta.count({
      where: { terapeutaId: usuario.id, activo: true },
    }),
    prisma.seguimiento.findMany({
      orderBy: { fecha: "desc" },
      take: 5,
      include: {
        beneficiario: {
          select: { id: true, nombres: true, apellidos: true, codigoExpediente: true },
        },
      },
    }),
  ]);

  // La agregación de donaciones solo se consulta si el rol puede verlas.
  const recaudado = puedeVerDonaciones
    ? await prisma.donacion.aggregate({
        where: { estado: "COMPLETADA" },
        _sum: { monto: true },
      })
    : null;

  const bitacora = puedeVerAuditoria
    ? await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 })
    : [];

  // Los avisos de recaudación: solo para quien puede verla.
  const avisos = puedeVerDonaciones ? await avisosRecaudacion() : null;

  return (
    <>
      <EncabezadoPagina
        titulo={`Buen día, ${usuario.nombre.split(" ")[0]}`}
        descripcion="Resumen del centro. Cada tarjeta lleva a su sección; lo que no aparece es porque tu rol no lo tiene habilitado."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Beneficiarios activos"
          valor={totalBeneficiarios}
          icono={<Users className="size-5" />}
        />
        <Kpi
          etiqueta="Con padrino asignado"
          valor={conPadrino}
          detalle={`${totalBeneficiarios - conPadrino} esperan apoyo`}
          icono={<UserCheck className="size-5" />}
        />
        <Kpi
          etiqueta="Expedientes por completar"
          valor={incompletos}
          icono={<TriangleAlert className="size-5" />}
        />
        {puedeVerDonaciones ? (
          <Kpi
            etiqueta="Recaudado (completadas)"
            valor={formatQuetzales(aNumero(recaudado?._sum.monto ?? 0))}
            icono={<HandCoins className="size-5" />}
          />
        ) : puedeVerSolicitudes ? (
          <Kpi
            etiqueta="Solicitudes nuevas"
            valor={solicitudesNuevas}
            icono={<Inbox className="size-5" />}
          />
        ) : (
          <Kpi
            etiqueta="Casos a mi cargo"
            valor={casosAsignados}
            icono={<Activity className="size-5" />}
          />
        )}
      </div>

      {avisos ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Recaudación: lo que espera tu decisión"
            icono={<BellRing className="size-5" />}
          />
          <ul className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <li className="px-5 py-4">
              <p className="font-heading text-2xl font-semibold text-ink">{avisos.porVerificar}</p>
              <Link href="/admin/donaciones?estado=POR_VERIFICAR" className="text-sm font-semibold text-brand-primary hover:underline">
                {avisos.porVerificar === 1 ? "comprobante por verificar" : "comprobantes por verificar"}
              </Link>
            </li>
            <li className="px-5 py-4">
              <p className="font-heading text-2xl font-semibold text-ink">{avisos.sinAportar}</p>
              <Link href="/admin/asignaciones" className="text-sm font-semibold text-brand-primary hover:underline">
                {avisos.sinAportar === 1 ? "padrino con más de 6 meses sin aportar" : "padrinos con más de 6 meses sin aportar"}
              </Link>
            </li>
            <li className="px-5 py-4">
              <p className="font-heading text-2xl font-semibold text-ink">{avisos.caducan}</p>
              <Link href="/admin/asignaciones" className="text-sm font-semibold text-brand-primary hover:underline">
                {avisos.caducan === 1 ? "compromiso caducado o por caducar" : "compromisos caducados o por caducar"}
              </Link>
            </li>
          </ul>
        </Tarjeta>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaCabecera
            titulo="Últimos avances registrados"
            icono={<FolderOpen className="size-5" />}
          />
          {ultimosAvances.length === 0 ? (
            <Vacio mensaje="Todavía no hay avances registrados." />
          ) : (
            <ul className="divide-y divide-line">
              {ultimosAvances.map((avance) => (
                <li key={avance.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-ink-soft">
                      {formatFecha(avance.fecha)}
                    </span>
                    <Chip tono="neutro">{avance.area}</Chip>
                    {avance.visibleParaPadrino ? (
                      <Chip tono="ok">Visible para el padrino</Chip>
                    ) : (
                      <Chip tono="warn">Solo uso interno</Chip>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-ink">
                    {avance.titulo}
                  </p>
                  <Link
                    href={`/admin/beneficiarios/${avance.beneficiario.id}`}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {avance.beneficiario.nombres} {avance.beneficiario.apellidos}
                    <span className="visually-hidden">
                      , expediente {avance.beneficiario.codigoExpediente}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {puedeVerAuditoria ? (
          <Tarjeta>
            <TarjetaCabecera
              titulo="Actividad reciente"
              descripcion="Últimos movimientos de la bitácora."
            />
            <ul className="divide-y divide-line">
              {bitacora.map((entrada) => (
                <li key={entrada.id} className="px-5 py-3">
                  <p className="text-sm text-ink">{entrada.detalle ?? entrada.accion}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {entrada.actor} · {formatFechaHora(entrada.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3">
              <Link
                href="/admin/auditoria"
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                Ver la bitácora completa
              </Link>
            </div>
          </Tarjeta>
        ) : puedeVerSolicitudes ? (
          <Tarjeta>
            <TarjetaCabecera
              titulo="Pendientes de atender"
              descripcion="Formularios recibidos desde el sitio público."
            />
            <div className="px-5 py-6">
              <p className="text-sm text-ink">
                {solicitudesNuevas}{" "}
                {solicitudesNuevas === 1
                  ? "inscripción nueva sin revisar"
                  : "inscripciones nuevas sin revisar"}
              </p>
              <Link
                href="/admin/solicitudes"
                className="mt-2 inline-block text-sm font-semibold text-brand-primary hover:underline"
              >
                Ir a solicitudes
              </Link>
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta>
            <TarjetaCabecera
              titulo="Mis casos de terapia"
              descripcion="Los beneficiarios que tienes asignados."
            />
            <div className="px-5 py-6">
              <p className="text-sm text-ink">
                {casosAsignados}{" "}
                {casosAsignados === 1
                  ? "caso asignado a tu nombre"
                  : "casos asignados a tu nombre"}
              </p>
              <Link
                href="/admin/beneficiarios?alerta=mis-casos"
                className="mt-2 inline-block text-sm font-semibold text-brand-primary hover:underline"
              >
                Ver mis casos
              </Link>
            </div>
          </Tarjeta>
        )}
      </div>
    </>
  );
}

/**
 * Lo que la administración tiene pendiente en recaudación: comprobantes sin
 * revisar, padrinos con más de seis meses sin aportar y compromisos que
 * caducan en los próximos treinta días o ya caducaron.
 */
async function avisosRecaudacion() {
  const hoy = new Date();
  const [porVerificar, activos] = await Promise.all([
    prisma.donacion.count({
      where: { estado: "PENDIENTE", boletaArchivo: { not: null } },
    }),
    prisma.padrinazgo.findMany({
      where: { activo: true },
      select: { id: true, fechaInicio: true, caducaEl: true, avisoAtendidoEl: true },
    }),
  ]);
  const resumenes = await resumenesCompromisos(activos.map((p) => p.id), hoy);
  const sinAportar = activos.filter((p) =>
    necesitaAvisoAdmin(
      resumenes.get(p.id)?.ultimoAporte ?? null,
      p.fechaInicio,
      p.avisoAtendidoEl,
      hoy,
    ),
  ).length;
  const caducan = activos.filter(
    (p) => p.caducaEl && diasEntre(hoy, p.caducaEl) <= DIAS_CADUCA_PRONTO,
  ).length;
  return { porVerificar, sinAportar, caducan };
}
