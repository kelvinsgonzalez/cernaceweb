import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, EnlaceBoton, Tarjeta } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";

export const metadata: Metadata = { title: "Auditoría" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Fecha y hora", "Actor", "Acción", "Entidad", "Detalle", "IP"];
const POR_PAGINA = 25;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string; entidad?: string; pagina?: string }>;
}) {
  await requirePermiso(PERMISOS.AUDITORIA_LEER);
  const { accion, entidad, pagina } = await searchParams;

  const paginaActual = Math.max(1, Number(pagina) || 1);
  const filtro = {
    ...(accion ? { accion } : {}),
    ...(entidad ? { entidad } : {}),
  };

  const [entradas, total, acciones, entidades] = await Promise.all([
    prisma.auditLog.findMany({
      where: filtro,
      orderBy: { createdAt: "desc" },
      skip: (paginaActual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.auditLog.count({ where: filtro }),
    prisma.auditLog.findMany({
      distinct: ["accion"],
      select: { accion: true },
      orderBy: { accion: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["entidad"],
      select: { entidad: true },
      orderBy: { entidad: "asc" },
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const parametros = new URLSearchParams();
  if (accion) parametros.set("accion", accion);
  if (entidad) parametros.set("entidad", entidad);
  const base = parametros.toString() ? `&${parametros.toString()}` : "";

  return (
    <>
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Bitácora de accesos y cambios. Cada apertura de expediente y cada modificación deja una entrada."
      />

      <Tarjeta className="p-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accion" className="text-sm font-semibold text-ink">
              Acción
            </label>
            <select
              id="accion"
              name="accion"
              defaultValue={accion ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todas</option>
              {acciones.map((a) => (
                <option key={a.accion} value={a.accion}>
                  {a.accion}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="entidad" className="text-sm font-semibold text-ink">
              Entidad
            </label>
            <select
              id="entidad"
              name="entidad"
              defaultValue={entidad ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todas</option>
              {entidades.map((e) => (
                <option key={e.entidad} value={e.entidad}>
                  {e.entidad}
                </option>
              ))}
            </select>
          </div>

          <Boton type="submit" variante="contorno">
            Filtrar
          </Boton>
          {accion || entidad ? (
            <EnlaceBoton href="/admin/auditoria" variante="suave">
              Limpiar
            </EnlaceBoton>
          ) : null}
        </form>
      </Tarjeta>

      <p className="mt-6 text-sm text-ink-soft" role="status">
        {total} {total === 1 ? "entrada" : "entradas"} · página {paginaActual} de{" "}
        {totalPaginas}
      </p>

      <div className="mt-3">
        <Tabla
          caption="Bitácora de auditoría con la fecha, el actor, la acción y la entidad afectada"
          columnas={COLUMNAS}
        >
          {entradas.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="No hay entradas con esos filtros."
            />
          ) : (
            entradas.map((entrada) => (
              <Fila key={entrada.id}>
                <Celda className="whitespace-nowrap">
                  {formatFechaHora(entrada.createdAt)}
                </Celda>
                <Celda>{entrada.actor}</Celda>
                <Celda>
                  <Chip tono="neutro">{entrada.accion}</Chip>
                </Celda>
                <Celda>{entrada.entidad}</Celda>
                <Celda className="max-w-md">{entrada.detalle ?? "—"}</Celda>
                <Celda className="font-mono text-xs">{entrada.ip ?? "—"}</Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>

      <nav aria-label="Paginación de la bitácora" className="mt-6 flex gap-3">
        {paginaActual > 1 ? (
          <EnlaceBoton
            href={`/admin/auditoria?pagina=${paginaActual - 1}${base}`}
            variante="contorno"
          >
            Página anterior
          </EnlaceBoton>
        ) : null}
        {paginaActual < totalPaginas ? (
          <EnlaceBoton
            href={`/admin/auditoria?pagina=${paginaActual + 1}${base}`}
            variante="contorno"
          >
            Página siguiente
          </EnlaceBoton>
        ) : null}
      </nav>
    </>
  );
}
