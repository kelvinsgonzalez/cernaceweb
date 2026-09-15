/**
 * Centros de apoyo donde CERNACE da terapia. Los dos están en el municipio de
 * Cuilco, Huehuetenango. La lista solo sugiere: el campo del expediente es
 * texto libre, así que abrir un centro nuevo no exige tocar código.
 */
export const CENTROS = ["San Pedro", "Posonicapa"] as const;
export const CENTRO_PREDETERMINADO: (typeof CENTROS)[number] = "San Pedro";
