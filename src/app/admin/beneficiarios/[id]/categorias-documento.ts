/**
 * Categorías de los documentos adjuntos. Van en un módulo sin "use client"
 * para que tanto la página (servidor) como el formulario (cliente) reciban el
 * arreglo de verdad.
 */

/** Las que ya se usan en el expediente, para no inventar categorías nuevas. */
export const CATEGORIAS_DOCUMENTO = [
  "Identificación",
  "Clínico",
  "Educativo",
  "Socioeconómico",
  "Autorizaciones",
  "Informes de terapia",
  "Otros",
];

/**
 * Las que todo expediente debe tener adjuntas. Si falta alguna, el apartado de
 * documentos se marca incompleto y `faltante` es cómo se nombra en el aviso.
 */
export const CATEGORIAS_REQUERIDAS: { categoria: string; faltante: string }[] = [
  { categoria: "Identificación", faltante: "documento de identificación" },
  { categoria: "Clínico", faltante: "documento clínico" },
  { categoria: "Autorizaciones", faltante: "autorizaciones firmadas" },
];
