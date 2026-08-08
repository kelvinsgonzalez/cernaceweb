import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}

/** Primer nombre: lo único que la galería pública puede mostrar. */
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

/** Decimal de Prisma → número, sin depender del tipo runtime. */
export function aNumero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  return Number(valor.toString());
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
