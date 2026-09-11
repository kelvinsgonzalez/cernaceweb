import { prisma } from "@/lib/prisma";
import { usuarioActual, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerFotoExpediente } from "@/lib/almacenamiento";

/**
 * Foto de evidencia del expediente. Nunca es pública, a diferencia de la foto
 * principal: aquí no hay autorización de galería que valga. La ven
 *  - el personal con expediente.leer;
 *  - la propia familia y el padrino, y solo si la foto está compartida.
 * El resto recibe 404, no 403: quien no puede verla tampoco tiene por qué
 * saber que existe.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const foto = await prisma.fotoExpediente.findUnique({
    where: { id },
    select: {
      archivo: true,
      tipoMime: true,
      beneficiarioId: true,
      visibleParaPadrino: true,
    },
  });
  if (!foto) return new Response(null, { status: 404 });

  const usuario = await usuarioActual();
  if (!usuario) return new Response(null, { status: 404 });

  let autorizado = tienePermiso(usuario, PERMISOS.EXPEDIENTE_LEER);

  if (
    !autorizado &&
    foto.visibleParaPadrino &&
    usuario.beneficiarioId === foto.beneficiarioId
  ) {
    autorizado = true;
  }

  if (!autorizado && foto.visibleParaPadrino && usuario.padrinoId) {
    const padrinazgo = await prisma.padrinazgo.count({
      where: {
        padrinoId: usuario.padrinoId,
        beneficiarioId: foto.beneficiarioId,
        activo: true,
      },
    });
    autorizado = padrinazgo > 0;
  }

  if (!autorizado) return new Response(null, { status: 404 });

  const contenido = await leerFotoExpediente(foto.archivo);
  if (!contenido) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": foto.tipoMime,
      "Content-Length": String(contenido.byteLength),
      // Privada: es la foto de un menor, no debe quedar en caches compartidas.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
