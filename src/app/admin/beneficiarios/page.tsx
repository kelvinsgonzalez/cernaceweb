import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search, TriangleAlert, UserCheck, UserX, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  ChipEstadoBeneficiario,
  ChipEstadoExpediente,
  EnlaceBoton,
  Kpi,
  Tarjeta,
} from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { calcularEdad, formatFecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Beneficiarios" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Expediente",
  "Nombre",
  "Edad",
  "Programa",
  "Padrino",
  "Estado",
  "Expediente",
  "",
];

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; programa?: string; estado?: string }>;
}) {
  await requirePermiso(PERMISOS.EXPEDIENTE_LEER);
  const { q, programa, estado } = await searchParams;

  const busqueda = q?.trim() ?? "";

  const filtros = {
    ...(busqueda
      ? {
          OR: [
            { nombres: { contains: busqueda, mode: "insensitive" as const } },
            { apellidos: { contains: busqueda, mode: "insensitive" as const } },
            {
              codigoExpediente: {
                contains: busqueda,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(programa ? { programaId: programa } : {}),
    ...(estado
      ? { estado: estado as "ACTIVO" | "INACTIVO" | "EGRESADO" }
      : {}),
  };

  const [total, conPadrino, sinPadrino, incompletos, programas, beneficiarios] =
    await Promise.all([
      prisma.beneficiario.count(),
      prisma.beneficiario.count({ where: { padrinazgos: { some: { activo: true } } } }),
      prisma.beneficiario.count({ where: { padrinazgos: { none: { activo: true } } } }),
      prisma.beneficiario.count({ where: { estadoExpediente: { not: "COMPLETO" } } }),
      prisma.programa.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
      prisma.beneficiario.findMany({
        where: filtros,
        orderBy: { codigoExpediente: "asc" },
        include: {
          programa: { select: { nombre: true } },
          padrinazgos: {
            where: { activo: true },
            select: { padrino: { select: { nombre: true } } },
          },
        },
      }),
    ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Beneficiarios"
        descripcion="Expedientes digitalizados y centralizados. Cada apertura queda registrada en la bitácora."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi etiqueta="Total" valor={total} icono={<Users className="size-5" />} />
        <Kpi
          etiqueta="Con padrino"
          valor={conPadrino}
          icono={<UserCheck className="size-5" />}
        />
        <Kpi
          etiqueta="Sin padrino"
          valor={sinPadrino}
          icono={<UserX className="size-5" />}
        />
        <Kpi
          etiqueta="Expedientes incompletos"
          valor={incompletos}
          icono={<TriangleAlert className="size-5" />}
        />
      </div>

      {/* Filtros con formulario GET: funcionan sin JavaScript. */}
      <Tarjeta className="mt-8 p-5">
        <form method="get" className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-sm font-semibold text-ink">
              Buscar
            </label>
            <p id="q-ayuda" className="text-xs text-ink-soft">
              Por nombre, apellido o código de expediente.
            </p>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={busqueda}
              aria-describedby="q-ayuda"
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="programa" className="text-sm font-semibold text-ink">
              Programa
            </label>
            <select
              id="programa"
              name="programa"
              defaultValue={programa ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todos</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="estado" className="text-sm font-semibold text-ink">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="EGRESADO">Egresado</option>
            </select>
          </div>

          <Boton type="submit" variante="contorno">
            <Filter aria-hidden="true" className="size-4" />
            Filtrar
          </Boton>
          {busqueda || programa || estado ? (
            <EnlaceBoton href="/admin/beneficiarios" variante="suave">
              Limpiar
            </EnlaceBoton>
          ) : null}
        </form>
      </Tarjeta>

      <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft" role="status">
        <Search aria-hidden="true" className="size-4" />
        {beneficiarios.length}{" "}
        {beneficiarios.length === 1
          ? "expediente encontrado"
          : "expedientes encontrados"}
      </p>

      <div className="mt-3">
        <Tabla
          caption="Listado de beneficiarios con su programa, padrino asignado y estado del expediente"
          columnas={COLUMNAS}
        >
          {beneficiarios.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="Ningún expediente coincide con los filtros aplicados."
            />
          ) : (
            beneficiarios.map((b) => {
              const nombreCompleto = `${b.nombres} ${b.apellidos}`;
              const padrino = b.padrinazgos[0]?.padrino.nombre;
              return (
                <Fila key={b.id}>
                  <Celda className="font-mono text-xs">{b.codigoExpediente}</Celda>
                  <Celda>
                    <span className="font-medium">{nombreCompleto}</span>
                    <span className="block text-xs text-ink-soft">
                      Ingresó el {formatFecha(b.fechaIngreso)}
                    </span>
                  </Celda>
                  <Celda>{calcularEdad(b.fechaNacimiento)} años</Celda>
                  <Celda>{b.programa.nombre}</Celda>
                  <Celda>
                    {padrino ?? (
                      <span className="text-ink-soft">Sin asignar</span>
                    )}
                  </Celda>
                  <Celda>
                    <ChipEstadoBeneficiario estado={b.estado} />
                  </Celda>
                  <Celda>
                    <ChipEstadoExpediente estado={b.estadoExpediente} />
                  </Celda>
                  <Celda>
                    <Link
                      href={`/admin/beneficiarios/${b.id}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Ver expediente
                      <span className="visually-hidden"> de {nombreCompleto}</span>
                    </Link>
                  </Celda>
                </Fila>
              );
            })
          )}
        </Tabla>
      </div>
    </>
  );
}
