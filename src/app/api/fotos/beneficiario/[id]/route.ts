import { prisma } from "@/lib/prisma";
import { usuarioActual, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerFotoBeneficiario, tipoPorExtension } from "@/lib/almacenamiento";

/**
 * Foto de perfil de un beneficiario.
 *
 * Es pública mientras se cumplan a la vez las dos condiciones que lo ponen en
 * el sitio: la familia pidió patrocinador y la administración lo autorizó. En
 * cuanto se retira la autorización, la foto deja de servirse a quien no tenga
 * sesión, sin tener que mover ni borrar el archivo. Por eso no vive en public/.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      fotoArchivo: true,
      estado: true,
      solicitaPatrocinio: true,
      publicadoEnGaleria: true,
    },
  });
  if (!beneficiario?.fotoArchivo) return new Response(null, { status: 404 });

  const publica =
    beneficiario.estado === "ACTIVO" &&
    beneficiario.solicitaPatrocinio &&
    beneficiario.publicadoEnGaleria;

  if (!publica) {
    const usuario = await usuarioActual();
    const esSuya = usuario?.beneficiarioId === id;
    if (!esSuya && !tienePermiso(usuario, PERMISOS.EXPEDIENTE_LEER)) {
      return new Response(null, { status: 404 });
    }
  }

  const contenido = await leerFotoBeneficiario(beneficiario.fotoArchivo);
  if (!contenido) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": tipoPorExtension(beneficiario.fotoArchivo),
      "Content-Length": String(contenido.byteLength),
      // Corta: si se retira la autorización, la caché no la mantiene visible.
      "Cache-Control": publica ? "public, max-age=300" : "private, max-age=300",
    },
  });
}
