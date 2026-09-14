/**
 * Historias de avance: los relatos con foto que la landing publica y que el
 * equipo mantiene desde /admin/historias.
 *
 * La franja de la landing tiene seis espacios. El tope no es decorativo: la
 * portada se lee de un vistazo y con más relatos deja de leerse, así que el
 * séptimo no se publica hasta que alguno baje a borrador.
 */

export const MAXIMO_HISTORIAS = 6;

/** Lo que se lee en la tarjeta de la landing; más largo no cabe. */
export const MAXIMO_RESUMEN = 240;

type HistoriaConImagen = {
  id: string;
  imagenArchivo: string | null;
  imagenUrl: string | null;
};

/**
 * De dónde sale la foto. Manda la que subió el equipo; `imagenUrl` es el
 * respaldo de las historias que llegaron por el seed apuntando a public/.
 *
 * Una URL externa guardada a mano se descarta: next/image solo tiene
 * configurado el dominio propio y reventaría la página entera.
 */
export function urlImagenHistoria(historia: HistoriaConImagen): string | null {
  if (historia.imagenArchivo) return `/api/historias/${historia.id}/imagen`;
  if (historia.imagenUrl?.startsWith("/")) return historia.imagenUrl;
  return null;
}

export function tieneImagen(historia: HistoriaConImagen): boolean {
  return urlImagenHistoria(historia) !== null;
}

/** El texto alternativo que se guardó o, si no hay, uno que al menos sitúa. */
export function textoAlternativo(historia: {
  imagenAlt: string | null;
  protagonista: string;
}): string {
  return historia.imagenAlt?.trim() || `Fotografía de ${historia.protagonista}`;
}
