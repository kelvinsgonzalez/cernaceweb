import { prisma } from "@/lib/prisma";
import { usuarioActual, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerImagenAvance } from "@/lib/almacenamiento";

/**
 * Sirve la foto de un avance solo a quien puede verla:
 *  - el personal con seguimiento.leer;
 *  - el padrino del beneficiario y la propia familia, y únicamente si el
 *    avance está marcado como compartido.
 * Cualquier otro caso devuelve 404, no 403: quien no puede verla tampoco tiene
 * por qué saber que existe.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const foto = await prisma.fotoAvance.findUnique({
    where: { id },
    select: {
      archivo: true,
      tipoMime: true,
      seguimiento: {
        select: { beneficiarioId: true, visibleParaPadrino: true },
      },
    },
  });
  if (!foto) return new Response(null, { status: 404 });

  const usuario = await usuarioActual();
  if (!usuario) return new Response(null, { status: 404 });

  let autorizado = tienePermiso(usuario, PERMISOS.SEGUIMIENTO_LEER);

  if (
    !autorizado &&
    usuario.beneficiarioId === foto.seguimiento.beneficiarioId &&
    foto.seguimiento.visibleParaPadrino
  ) {
    autorizado = true;
  }

  if (!autorizado && usuario.padrinoId && foto.seguimiento.visibleParaPadrino) {
    const padrinazgo = await prisma.padrinazgo.count({
      where: {
        padrinoId: usuario.padrinoId,
        beneficiarioId: foto.seguimiento.beneficiarioId,
        activo: true,
      },
    });
    autorizado = padrinazgo > 0;
  }

  if (!autorizado) return new Response(null, { status: 404 });

  const contenido = await leerImagenAvance(foto.archivo);
  if (!contenido) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": foto.tipoMime,
      "Content-Length": String(contenido.byteLength),
      // Privada: es una foto de un menor, no debe quedar en caches compartidas.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
