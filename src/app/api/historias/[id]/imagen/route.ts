import { prisma } from "@/lib/prisma";
import { tienePermiso, usuarioActual } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerImagenHistoria, tipoPorExtension } from "@/lib/almacenamiento";

/**
 * Sirve la foto de una historia de avance. A diferencia de las fotos de un
 * expediente, esta es material que el centro quiere enseñar: si la historia
 * está publicada, la ve cualquiera que abra la landing, sin sesión.
 *
 * Un borrador es otra cosa: todavía no se ha decidido publicarlo, así que solo
 * lo ve quien gestiona el contenido y lo está revisando en el panel. Para el
 * resto es un 404, no un 403: de un borrador nadie tiene por qué enterarse.
 *
 * No vive en public/ porque el equipo la sube desde el panel y public/ es parte
 * del árbol del despliegue: un redeploy se llevaría las fotos por delante.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const historia = await prisma.story.findUnique({
    where: { id },
    select: { imagenArchivo: true, imagenTipoMime: true, estado: true },
  });
  if (!historia?.imagenArchivo) return new Response(null, { status: 404 });

  const publicada = historia.estado === "PUBLICADO";
  if (!publicada) {
    const usuario = await usuarioActual();
    if (!tienePermiso(usuario, PERMISOS.CONTENIDO_GESTIONAR)) {
      return new Response(null, { status: 404 });
    }
  }

  const contenido = await leerImagenHistoria(historia.imagenArchivo);
  if (!contenido) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type":
        historia.imagenTipoMime || tipoPorExtension(historia.imagenArchivo),
      "Content-Length": String(contenido.byteLength),
      // La URL no cambia al reemplazar la foto, así que la caché es corta:
      // lo suficiente para no releer el disco en cada visita, lo bastante poco
      // para que un cambio en el panel se vea sin esperar.
      "Cache-Control": publicada
        ? "public, max-age=300"
        : "private, no-store",
    },
  });
}
