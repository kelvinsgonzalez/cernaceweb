import { prisma } from "@/lib/prisma";
import { tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerFotoCampana, tipoPorExtension } from "@/lib/almacenamiento";

/**
 * Sirve la foto de una campaña. Mientras la campaña está activa la ve
 * cualquiera que abra la portada, sin sesión. Cerrada, solo la ve quien
 * consulta donaciones en el panel: para el resto es un 404.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const foto = await prisma.campaignFoto.findUnique({
    where: { id },
    select: { archivo: true, tipoMime: true, campaign: { select: { activa: true } } },
  });
  if (!foto) return new Response(null, { status: 404 });

  const publica = foto.campaign.activa;
  if (!publica) {
    const usuario = await usuarioActual();
    if (!tienePermiso(usuario, PERMISOS.DONACIONES_LEER)) {
      return new Response(null, { status: 404 });
    }
  }

  const contenido = await leerFotoCampana(foto.archivo);
  if (!contenido) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": foto.tipoMime || tipoPorExtension(foto.archivo),
      "Content-Length": String(contenido.byteLength),
      "Cache-Control": publica ? "public, max-age=3600" : "private, no-store",
    },
  });
}
