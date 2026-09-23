import { headers } from "next/headers";

/**
 * La dirección pública del sitio, para los enlaces que salen de él: los que
 * se comparten en redes y las imágenes de vista previa (Open Graph).
 *
 * Si `NEXT_PUBLIC_URL_SITIO` está definida (p. ej. https://cernace.org) manda
 * ella. Sin ella se arma con las cabeceras de la petición, que detrás del túnel
 * o del proxy traen el host y el protocolo reales en `x-forwarded-*`.
 */
export async function urlSitio(): Promise<string> {
  const fija = process.env.NEXT_PUBLIC_URL_SITIO?.trim().replace(/\/+$/, "");
  if (fija) return fija;

  const cabeceras = await headers();
  const host =
    cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "localhost:3100";
  const protocolo =
    cabeceras.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/** La ruta pública de una campaña: la que se comparte. */
export function rutaCampana(slug: string): string {
  return `/campanas/${slug}`;
}

/** El enlace completo de una campaña, listo para pegar en redes. */
export async function urlCampana(slug: string): Promise<string> {
  return `${await urlSitio()}${rutaCampana(slug)}`;
}
