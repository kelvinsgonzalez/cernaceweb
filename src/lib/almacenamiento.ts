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

export const TIPOS_DOCUMENTO = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const TAMANO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024;

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

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
  if (!TIPOS_IMAGEN.includes(archivo.type as (typeof TIPOS_IMAGEN)[number])) {
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

  const nombre = `${randomUUID()}.${EXTENSIONES[archivo.type]}`;
  const contenido = Buffer.from(await archivo.arrayBuffer());
  await writeFile(path.join(destino, nombre), contenido);

  return {
    archivo: nombre,
    tipoMime: archivo.type,
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

/** Un expediente admite PDF además de imágenes, y pesos algo mayores. */
export function validarDocumento(archivo: File): string | null {
  if (archivo.size === 0) return "El archivo llegó vacío.";
  if (archivo.size > TAMANO_MAXIMO_DOCUMENTO) {
    return `El documento no puede pasar de ${TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)} MB.`;
  }
  if (!TIPOS_DOCUMENTO.includes(archivo.type as (typeof TIPOS_DOCUMENTO)[number])) {
    return "Solo se admiten PDF o imágenes JPG, PNG y WebP.";
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

/** Deduce el tipo a partir de la extensión, para servir el archivo guardado. */
export function tipoPorExtension(nombre: string): string {
  const ext = path.extname(nombre).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".pdf") return "application/pdf";
  return "image/jpeg";
}

/** Ruta absoluta de la carpeta de documentos, para el seed de demostración. */
export function rutaCarpetaDocumentos(): string {
  return carpeta(CARPETA_DOCUMENTOS);
}
