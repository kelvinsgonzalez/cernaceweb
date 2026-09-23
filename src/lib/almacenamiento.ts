import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Las fotos de los avances NO viven en public/: ahí cualquiera con el enlace
 * vería la cara de un niño. Se guardan en un directorio aparte y se sirven por
 * /api/fotos/[id], que comprueba el permiso antes de devolver el fichero.
 *
 * El directorio se configura con ALMACENAMIENTO_DIR. En el VPS conviene que
 * apunte fuera del árbol del despliegue, para que un redeploy no lo borre.
 */

const CARPETA_AVANCES = "avances";
const CARPETA_BENEFICIARIOS = "beneficiarios";
const CARPETA_DOCUMENTOS = "documentos";
const CARPETA_EVIDENCIAS = "evidencias";
const CARPETA_BOLETAS = "boletas";
const CARPETA_HISTORIAS = "historias";
const CARPETA_CAMPANAS = "campanas";

/**
 * Se resuelve en cada llamada para que un cambio de ALMACENAMIENTO_DIR surta
 * efecto sin reiniciar el proceso.
 *
 * El build avisa aquí de «dynamic filesystem access»: es inevitable si la ruta
 * sale de una variable de entorno, y es el precio de poder apuntar el
 * almacenamiento fuera del árbol del despliegue en el VPS, para que un redeploy
 * no se lleve por delante las fotos. Solo afecta al rastreo de dependencias de
 * una salida `standalone`, que este proyecto no usa.
 */
function carpeta(nombre: string): string {
  const raiz = path.resolve(
    process.env.ALMACENAMIENTO_DIR ?? path.join(process.cwd(), "almacenamiento"),
  );
  return path.join(raiz, nombre);
}

export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANO_MAXIMO = 5 * 1024 * 1024;
/** Fotos por reseña. Vive aquí y no en el server action: un archivo
 *  "use server" solo puede exportar funciones async. */
export const MAXIMO_FOTOS = 4;
/** Fotos de evidencia por subida. El expediente no tiene tope: se van sumando. */
export const MAXIMO_FOTOS_EXPEDIENTE = 8;

/**
 * Las fotos del iPhone salen en HEIC. Se admiten donde el archivo solo hay que
 * guardarlo para que alguien lo abra —boletas y documentos—, y no donde luego
 * se pinta en la web: Chrome y Firefox no saben mostrar un HEIC.
 */
export const TIPOS_FOTO_IPHONE = ["image/heic", "image/heif"] as const;

export function esFotoIphone(tipoMime: string): boolean {
  return TIPOS_FOTO_IPHONE.includes(
    tipoMime.toLowerCase() as (typeof TIPOS_FOTO_IPHONE)[number],
  );
}

export const TIPOS_DOCUMENTO = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  ...TIPOS_FOTO_IPHONE,
] as const;
export const TAMANO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024;

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "image/heic": "heic",
  "image/heif": "heif",
};

const TIPOS_POR_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * Manda el tipo que declara el navegador, salvo cuando no declara ninguno: con
 * un HEIC varios mandan el campo vacío o application/octet-stream, y entonces
 * la extensión es lo único que queda.
 */
export function tipoDeArchivo(archivo: File): string {
  const declarado = archivo.type.trim().toLowerCase();
  if (declarado && declarado !== "application/octet-stream") return declarado;
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
  return TIPOS_POR_EXTENSION[extension] ?? declarado;
}

export type ArchivoGuardado = {
  archivo: string;
  tipoMime: string;
  tamanoBytes: number;
};

export function validarImagen(archivo: File): string | null {
  if (archivo.size === 0) return "El archivo llegó vacío.";
  if (archivo.size > TAMANO_MAXIMO) {
    return `La imagen no puede pasar de ${TAMANO_MAXIMO / (1024 * 1024)} MB.`;
  }
  if (
    !TIPOS_IMAGEN.includes(tipoDeArchivo(archivo) as (typeof TIPOS_IMAGEN)[number])
  ) {
    return "Solo se admiten imágenes JPG, PNG o WebP.";
  }
  return null;
}

/**
 * El nombre lo genera el servidor: el que trae el navegador puede contener
 * rutas («../») y no se usa nunca para construir la ruta en disco.
 */
async function guardar(
  archivo: File,
  enCarpeta: string,
): Promise<ArchivoGuardado> {
  const destino = carpeta(enCarpeta);
  await mkdir(destino, { recursive: true });

  const tipo = tipoDeArchivo(archivo);
  const nombre = `${randomUUID()}.${EXTENSIONES[tipo]}`;
  const contenido = Buffer.from(await archivo.arrayBuffer());
  await writeFile(path.join(destino, nombre), contenido);

  return {
    archivo: nombre,
    tipoMime: tipo,
    tamanoBytes: contenido.byteLength,
  };
}

export function guardarImagenAvance(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_AVANCES);
}

export function guardarFotoBeneficiario(
  archivo: File,
): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_BENEFICIARIOS);
}

export function guardarDocumento(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_DOCUMENTOS);
}

export function guardarFotoExpediente(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_EVIDENCIAS);
}

/**
 * Foto de una historia de avance. Esta sí es material público —sale en la
 * landing—, pero se guarda igual fuera de public/ por una razón práctica: el
 * equipo la sube desde el panel y public/ es parte del árbol del despliegue,
 * así que un redeploy se la llevaría por delante. La sirve
 * /api/historias/[id]/imagen, que es quien decide si ya se puede enseñar.
 */
export function guardarImagenHistoria(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_HISTORIAS);
}

/** Foto de una campaña. Pública como la de una historia, y guardada fuera de
 *  public/ por la misma razón: la sube el equipo desde el panel. */
export function guardarFotoCampana(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_CAMPANAS);
}

/** Comprobante de una transferencia o un depósito. Lleva datos bancarios del
 *  donante, así que tampoco vive en public/: se sirve por /api/boletas/[id]. */
export function guardarBoleta(archivo: File): Promise<ArchivoGuardado> {
  return guardar(archivo, CARPETA_BOLETAS);
}

/** Un expediente admite PDF además de imágenes, y pesos algo mayores. */
export function validarDocumento(archivo: File): string | null {
  if (archivo.size === 0) return "El archivo llegó vacío.";
  if (archivo.size > TAMANO_MAXIMO_DOCUMENTO) {
    return `El documento no puede pasar de ${TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)} MB.`;
  }
  if (
    !TIPOS_DOCUMENTO.includes(
      tipoDeArchivo(archivo) as (typeof TIPOS_DOCUMENTO)[number],
    )
  ) {
    return "Solo se admiten PDF o imágenes JPG, PNG, WebP y HEIC.";
  }
  return null;
}

/** La boleta admite lo mismo que un documento; solo cambia cómo se nombra. */
export function validarBoleta(archivo: File): string | null {
  if (archivo.size === 0) return "El archivo llegó vacío.";
  if (archivo.size > TAMANO_MAXIMO_DOCUMENTO) {
    return `La boleta no puede pasar de ${TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)} MB.`;
  }
  if (
    !TIPOS_DOCUMENTO.includes(
      tipoDeArchivo(archivo) as (typeof TIPOS_DOCUMENTO)[number],
    )
  ) {
    return "Sube una foto de la boleta (JPG, PNG, WebP o HEIC del iPhone) o el PDF del banco.";
  }
  return null;
}

/** Rechaza cualquier nombre que intente salirse de la carpeta. */
function rutaSegura(nombre: string, enCarpeta: string): string | null {
  if (nombre !== path.basename(nombre)) return null;
  const base = carpeta(enCarpeta);
  const destino = path.join(base, nombre);
  if (!destino.startsWith(base + path.sep)) return null;
  return destino;
}

async function leer(nombre: string, enCarpeta: string): Promise<Buffer | null> {
  const destino = rutaSegura(nombre, enCarpeta);
  if (!destino) return null;
  try {
    return await readFile(destino);
  } catch {
    return null;
  }
}

async function borrar(nombre: string, enCarpeta: string): Promise<void> {
  const destino = rutaSegura(nombre, enCarpeta);
  if (!destino) return;
  try {
    await unlink(destino);
  } catch {
    // Si el fichero ya no está, la fila de la base manda: no es un error.
  }
}

export function leerImagenAvance(nombre: string) {
  return leer(nombre, CARPETA_AVANCES);
}

export function borrarImagenAvance(nombre: string) {
  return borrar(nombre, CARPETA_AVANCES);
}

export function leerFotoBeneficiario(nombre: string) {
  return leer(nombre, CARPETA_BENEFICIARIOS);
}

export function leerDocumento(nombre: string) {
  return leer(nombre, CARPETA_DOCUMENTOS);
}

export function borrarDocumento(nombre: string) {
  return borrar(nombre, CARPETA_DOCUMENTOS);
}

export function borrarFotoBeneficiario(nombre: string) {
  return borrar(nombre, CARPETA_BENEFICIARIOS);
}

export function leerFotoExpediente(nombre: string) {
  return leer(nombre, CARPETA_EVIDENCIAS);
}

export function borrarFotoExpediente(nombre: string) {
  return borrar(nombre, CARPETA_EVIDENCIAS);
}

export function leerImagenHistoria(nombre: string) {
  return leer(nombre, CARPETA_HISTORIAS);
}

export function borrarImagenHistoria(nombre: string) {
  return borrar(nombre, CARPETA_HISTORIAS);
}

export function leerFotoCampana(nombre: string) {
  return leer(nombre, CARPETA_CAMPANAS);
}

export function borrarFotoCampana(nombre: string) {
  return borrar(nombre, CARPETA_CAMPANAS);
}

export function leerBoleta(nombre: string) {
  return leer(nombre, CARPETA_BOLETAS);
}

export function borrarBoleta(nombre: string) {
  return borrar(nombre, CARPETA_BOLETAS);
}

/** Deduce el tipo a partir de la extensión, para servir el archivo guardado. */
export function tipoPorExtension(nombre: string): string {
  const extension = path.extname(nombre).toLowerCase().slice(1);
  return TIPOS_POR_EXTENSION[extension] ?? "image/jpeg";
}

/** Ruta absoluta de la carpeta de documentos, para el seed de demostración. */
export function rutaCarpetaDocumentos(): string {
  return carpeta(CARPETA_DOCUMENTOS);
}
