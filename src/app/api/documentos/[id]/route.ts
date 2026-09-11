import { prisma } from "@/lib/prisma";
import { usuarioActual, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { leerDocumento, tipoPorExtension } from "@/lib/almacenamiento";

/**
 * Entrega un documento del expediente a quien puede verlo: el personal con
 * documentos.leer, o —si el documento está marcado como compartido— el padrino
 * del beneficiario y la propia familia. Cualquier otro caso devuelve 404.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const documento = await prisma.documento.findUnique({
    where: { id },
    select: {
      nombre: true,
      archivo: true,
      tipoMime: true,
      visibleParaPadrino: true,
      beneficiarioId: true,
    },
  });
  if (!documento?.archivo) return new Response(null, { status: 404 });

  const usuario = await usuarioActual();
  if (!usuario) return new Response(null, { status: 404 });

  let autorizado = tienePermiso(usuario, PERMISOS.DOCUMENTOS_LEER);

  if (
    !autorizado &&
    usuario.beneficiarioId === documento.beneficiarioId &&
    documento.visibleParaPadrino
  ) {
    autorizado = true;
  }

  if (!autorizado && usuario.padrinoId && documento.visibleParaPadrino) {
    const padrinazgos = await prisma.padrinazgo.count({
      where: {
        padrinoId: usuario.padrinoId,
        beneficiarioId: documento.beneficiarioId,
        activo: true,
      },
    });
    autorizado = padrinazgos > 0;
  }

  if (!autorizado) return new Response(null, { status: 404 });

  const contenido = await leerDocumento(documento.archivo);
  if (!contenido) return new Response(null, { status: 404 });

  // `inline` para que el PDF se abra en el navegador; el nombre visible es el
  // que puso quien lo subió, no el aleatorio con que se guarda en disco.
  const nombre = documento.nombre.replace(/["\\\r\n]/g, "");

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": documento.tipoMime || tipoPorExtension(documento.archivo),
      "Content-Length": String(contenido.byteLength),
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
