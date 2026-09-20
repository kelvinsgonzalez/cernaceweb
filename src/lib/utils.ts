import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}

export function primerNombre(nombres: string): string {
  return nombres.trim().split(/\s+/)[0] ?? nombres;
}

export function iniciales(nombres: string, apellidos?: string): string {
  const a = nombres.trim()[0] ?? "";
  const b = apellidos?.trim()[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

export function formatTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Campo numérico de un formulario → entero, o null si viene vacío o no cuadra. */
export function aEntero(valor: string | undefined | null): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Decimal de Prisma → número, sin depender del tipo runtime. */
export function aNumero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  return Number(valor.toString());
}

/**
 * Las fotos no se sirven desde public/: pasan por una ruta que comprueba si el
 * beneficiario sigue autorizado. Sin archivo, la tarjeta cae a la inicial.
 */
export function urlFotoBeneficiario(
  id: string,
  archivo: string | null | undefined,
): string | null {
  return archivo ? `/api/fotos/beneficiario/${id}` : null;
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * ¿El enlace corresponde a la página actual? Coincidencia exacta o de prefijo
 * por segmento completo: así `/admin` no se enciende estando en
 * `/admin/beneficiarios`, y `/admin/donantes` no lo hace en `/admin/donaciones`.
 */
export function rutaActiva(ruta: string, href: string): boolean {
  return ruta === href || ruta.startsWith(`${href}/`);
}

/**
 * Las terapias de un niño en una sola línea, para las tarjetas y cabeceras.
 * Sin terapias anotadas se dice claramente, en vez de dejar el hueco.
 */
export function listarTerapias(terapias: { nombre: string }[]): string {
  if (terapias.length === 0) return "Sin terapias anotadas";
  return terapias.map((t) => t.nombre).join(" · ");
}
