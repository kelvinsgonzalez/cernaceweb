import { prisma } from "@/lib/prisma";
import { tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerBoleta, tipoPorExtension } from "@/lib/almacenamiento";

/**
 * Entrega la boleta de una donación al personal que revisa los aportes. Lleva
 * datos bancarios del donante, así que no vive en public/: quien no tenga
 * donaciones.leer no pasa de aquí.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const usuario = await usuarioActual();
  if (!tienePermiso(usuario, PERMISOS.DONACIONES_LEER)) {
    return new Response(null, { status: 404 });
  }

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: {
      boletaArchivo: true,
      boletaTipoMime: true,
      referenciaPasarela: true,
    },
  });
  if (!donacion?.boletaArchivo) return new Response(null, { status: 404 });

  const contenido = await leerBoleta(donacion.boletaArchivo);
  if (!contenido) return new Response(null, { status: 404 });

  // El nombre visible es la referencia, que es con lo que el equipo trabaja;
  // el de disco es un UUID que no le dice nada a nadie.
  const extension = donacion.boletaArchivo.split(".").pop() ?? "jpg";
  const nombre = `boleta-${donacion.referenciaPasarela}.${extension}`.replace(
    /["\\\r\n]/g,
    "",
  );

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type":
        donacion.boletaTipoMime || tipoPorExtension(donacion.boletaArchivo),
      "Content-Length": String(contenido.byteLength),
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
