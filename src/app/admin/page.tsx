import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
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
