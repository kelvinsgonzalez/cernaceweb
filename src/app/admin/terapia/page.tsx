import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, EnlaceBoton, Kpi, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { calcularEdad, formatFecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Terapia" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Beneficiario", "Programa", "Plan", "Equipo responsable", "Acción"];

export default async function TerapiaPage() {
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_LEER);
  const gestiona = tienePermiso(usuario, PERMISOS.TERAPIA_GESTIONAR);

  const [beneficiarios, misCasos] = await Promise.all([
    gestiona
      ? prisma.beneficiario.findMany({
          where: { estado: "ACTIVO" },
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoExpediente: true,
            fechaNacimiento: true,
            programa: { select: { nombre: true } },
            plan: { select: { activo: true, fechaAprobacion: true } },
            responsables: {
              where: { activo: true },
              select: { terapeuta: { select: { nombre: true } } },
            },
          },
          orderBy: { apellidos: "asc" },
        })
      : [],
    prisma.asignacionTerapeuta.findMany({
      where: { terapeutaId: usuario.id, activo: true },
      select: {
        id: true,
        desde: true,
        beneficiario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoExpediente: true,
            fechaNacimiento: true,
            programa: { select: { nombre: true } },
            plan: { select: { activo: true, objetivoGeneral: true } },
            _count: { select: { seguimientos: true } },
          },
        },
      },
      orderBy: { desde: "asc" },
    }),
  ]);

  const aprobados = beneficiarios.filter((b) => b.plan?.activo).length;
  const sinEquipo = beneficiarios.filter(
    (b) => b.plan?.activo && b.responsables.length === 0,
  ).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Terapia"
        descripcion="La aprobación autoriza a un niño a recibir terapia y fija su objetivo general; el equipo responsable decide quién puede publicar reseñas de sus avances."
      />

      <section aria-labelledby="mis-casos-titulo" className="mb-10">
        <Tarjeta>
          <TarjetaCabecera
            id="mis-casos-titulo"
            titulo="Mis casos"
            descripcion="Los niños de los que eres responsable."
          />
          {misCasos.length === 0 ? (
            <Vacio mensaje="No tienes beneficiarios asignados todavía. Las asignaciones las hace un administrador." />
          ) : (
            <ul className="divide-y divide-line">
              {misCasos.map((caso) => {
                const nino = caso.beneficiario;
                return (
                  <li key={caso.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/beneficiarios/${nino.id}`}
                          className="font-medium text-brand-dark hover:underline"
                        >
                          {nino.nombres} {nino.apellidos}
                        </Link>
                        <span className="block text-xs text-ink-soft">
                          {nino.codigoExpediente} ·{" "}
                          {calcularEdad(nino.fechaNacimiento)} años ·{" "}
                          {nino.programa.nombre} · responsable desde{" "}
                          {formatFecha(caso.desde)}
                        </span>
                        {nino.plan?.objetivoGeneral ? (
                          <p className="medida-lectura mt-2 text-sm text-ink-soft">
                            <span className="font-semibold text-ink">
                              Objetivo:{" "}
                            </span>
                            {nino.plan.objetivoGeneral}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Chip tono="neutro">
                          {nino._count.seguimientos}{" "}
                          {nino._count.seguimientos === 1 ? "avance" : "avances"}
                        </Chip>
                        {nino.plan?.activo ? (
                          <EnlaceBoton
                            href={`/admin/beneficiarios/${nino.id}/avance`}
                            variante="contorno"
                            className="px-3 py-1.5 text-xs"
                          >
                            Registrar avance
                            <span className="visually-hidden">
                              de {nino.nombres} {nino.apellidos}
                            </span>
                          </EnlaceBoton>
                        ) : (
                          <Chip tono="warn">Plan suspendido</Chip>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>
      </section>

      {gestiona ? (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <Kpi etiqueta="Aprobados para terapia" valor={aprobados} />
            <Kpi
              etiqueta="Sin aprobar"
              valor={beneficiarios.length - aprobados}
            />
            <Kpi etiqueta="Aprobados sin equipo" valor={sinEquipo} />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-heading text-xl font-semibold text-ink">
              Todos los beneficiarios activos
            </h2>
            <Tabla
              caption="Estado del plan de terapia y equipo responsable de cada beneficiario"
              columnas={COLUMNAS}
            >
              {beneficiarios.length === 0 ? (
                <FilaVacia
                  columnas={COLUMNAS.length}
                  mensaje="No hay beneficiarios activos."
                />
              ) : (
                beneficiarios.map((b) => (
                  <Fila key={b.id}>
                    <Celda>
                      <Link
                        href={`/admin/beneficiarios/${b.id}`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {b.nombres} {b.apellidos}
                      </Link>
                      <span className="block text-xs text-ink-soft">
                        {b.codigoExpediente}
                      </span>
                    </Celda>
                    <Celda>{b.programa.nombre}</Celda>
                    <Celda className="whitespace-nowrap">
                      {b.plan?.activo ? (
                        <Chip tono="ok">
                          Aprobado {formatFecha(b.plan.fechaAprobacion)}
                        </Chip>
                      ) : b.plan ? (
                        <Chip tono="warn">Suspendido</Chip>
                      ) : (
                        <Chip tono="bad">Sin aprobar</Chip>
                      )}
                    </Celda>
                    <Celda>
                      {b.responsables.length === 0 ? (
                        <span className="text-ink-soft">Sin asignar</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {b.responsables.map((r) => (
                            <li key={r.terapeuta.nombre}>
                              <Chip tono="info">{r.terapeuta.nombre}</Chip>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Celda>
                    <Celda>
                      <Link
                        href={`/admin/beneficiarios/${b.id}/terapia`}
                        className="text-sm font-semibold text-brand-dark hover:underline"
                      >
                        {b.plan ? "Editar" : "Aprobar"}
                        <span className="visually-hidden">
                          el plan de {b.nombres} {b.apellidos}
                        </span>
                      </Link>
                    </Celda>
                  </Fila>
                ))
              )}
            </Tabla>
          </div>
        </>
      ) : null}
    </>
  );
}
