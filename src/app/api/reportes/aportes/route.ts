import { tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { aCsv, filasReporte, rangoDesdeParametros } from "@/lib/reportes";

/**
 * Exporta a CSV los aportes aprobados en un rango. Es el mismo listado que
 * alimenta /admin/donaciones/reportes, sin agrupar: en Excel se agrupa como
 * cada quien quiera. Solo para quien puede leer donaciones.
 */
export async function GET(peticion: Request) {
  const usuario = await usuarioActual();
  if (!tienePermiso(usuario, PERMISOS.DONACIONES_LEER)) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(peticion.url);
  const rango = rangoDesdeParametros(
    url.searchParams.get("desde") ?? undefined,
    url.searchParams.get("hasta") ?? undefined,
  );
  const filas = await filasReporte(rango);
  const nombre = `aportes-${rango.desde.toISOString().slice(0, 10)}-a-${rango.hasta.toISOString().slice(0, 10)}.csv`;

  return new Response(aCsv(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
