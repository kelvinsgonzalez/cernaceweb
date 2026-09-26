import { Chip } from "@/components/ui";

/**
 * Completitud de cada apartado del expediente.
 *
 * Cada sección responde una sola pregunta: ¿ya se ingresaron sus datos? Las
 * reglas viven aquí, en un solo sitio, para que el índice y las cabeceras de
 * las tarjetas cuenten lo mismo. Son deliberadamente sencillas: lo que el
 * personal puede llenar desde los formularios del propio expediente.
 *
 * - `si`: el apartado tiene lo necesario (verde lima).
 * - `incompleto`: se empezó, pero falta algo; `faltan` dice qué (naranja).
 * - `falta`: no se ha tocado (naranja).
 * - `sin-acceso`: el rol no puede consultarlo y no se evalúa.
 * - `informativo`: el apartado no se llena, se genera solo (la auditoría).
 */
export type EstadoSeccion =
  | { estado: "si" }
  | { estado: "incompleto"; faltan: string[] }
  | { estado: "falta" }
  | { estado: "sin-acceso" }
  | { estado: "informativo" };

export type IdSeccion =
  | "generales"
  | "terapias"
  | "fotografias"
  | "inscripciones"
  | "clinico"
  | "socioeconomico"
  | "documentos"
  | "terapia"
  | "avances"
  | "auditoria";

export type DatosCompletitud = {
  generales: {
    cui: string | null;
    direccion: string | null;
    lugarNacimiento: string | null;
    idiomaHogar: string | null;
    escolaridad: string | null;
    telefono: string | null;
    encargado: {
      nombre: string;
      parentesco: string | null;
      telefono: string | null;
    } | null;
  };
  terapias: number;
  fotografias: { principal: boolean; evidencia: number };
  inscripciones: {
    ciclo: number;
    areaServicio: string | null;
    referidoPor: string | null;
    voBo: string | null;
  }[];
  /** Año del ciclo que debería tener ficha. */
  cicloActual: number;
  clinico: {
    permiso: boolean;
    ficha: {
      fechaDiagnostico: Date | null;
      medicoTratante: string | null;
    } | null;
    evaluaciones: number;
  };
  socioeconomico: { permiso: boolean; ficha: boolean };
  documentos: {
    permiso: boolean;
    lista: { categoria: string; vigente: boolean }[];
    categoriasRequeridas: { categoria: string; faltante: string }[];
  };
  plan: {
    permiso: boolean;
    ficha: { activo: boolean } | null;
    responsables: number;
  };
  avances: { permiso: boolean; total: number };
};

const hay = (valor: string | null | undefined) =>
  Boolean(valor && valor.trim().length > 0);

function conFaltantes(faltan: string[]): EstadoSeccion {
  return faltan.length === 0 ? { estado: "si" } : { estado: "incompleto", faltan };
}

export function evaluarCompletitud(
  d: DatosCompletitud,
): Record<IdSeccion, EstadoSeccion> {
  // Datos generales: el registro siempre existe, así que nunca «falta»; se
  // mira lo que la ficha pide y suele quedar en blanco al inscribir de prisa.
  const g = d.generales;
  const faltanGenerales: string[] = [];
  if (!hay(g.cui)) faltanGenerales.push("CUI");
  if (!hay(g.direccion)) faltanGenerales.push("dirección");
  if (!hay(g.lugarNacimiento)) faltanGenerales.push("lugar de nacimiento");
  if (!hay(g.idiomaHogar)) faltanGenerales.push("idioma del hogar");
  if (!hay(g.escolaridad)) faltanGenerales.push("escolaridad");
  if (!g.encargado) {
    faltanGenerales.push("encargado");
  } else {
    if (!hay(g.encargado.parentesco)) faltanGenerales.push("parentesco del encargado");
    if (!hay(g.telefono) && !hay(g.encargado.telefono)) {
      faltanGenerales.push("un teléfono de contacto");
    }
  }

  const fotografias: EstadoSeccion = d.fotografias.principal
    ? { estado: "si" }
    : d.fotografias.evidencia > 0
      ? { estado: "incompleto", faltan: ["foto principal"] }
      : { estado: "falta" };

  // La ficha más reciente es la vigente: se revisa esa y que sea del ciclo actual.
  const vigente = d.inscripciones[0];
  let inscripciones: EstadoSeccion;
  if (!vigente) {
    inscripciones = { estado: "falta" };
  } else {
    const faltan: string[] = [];
    if (vigente.ciclo < d.cicloActual) faltan.push(`ficha del ciclo ${d.cicloActual}`);
    if (!hay(vigente.areaServicio)) faltan.push("área de servicio");
    if (!hay(vigente.referidoPor)) faltan.push("referido por");
    if (!hay(vigente.voBo)) faltan.push("Vo.Bo.");
    inscripciones = conFaltantes(faltan);
  }

  let clinico: EstadoSeccion;
  if (!d.clinico.permiso) {
    clinico = { estado: "sin-acceso" };
  } else if (!d.clinico.ficha) {
    clinico = { estado: "falta" };
  } else {
    const faltan: string[] = [];
    if (!d.clinico.ficha.fechaDiagnostico) faltan.push("fecha del diagnóstico");
    if (!hay(d.clinico.ficha.medicoTratante)) faltan.push("médico tratante");
    if (d.clinico.evaluaciones === 0) faltan.push("al menos una evaluación clínica");
    clinico = conFaltantes(faltan);
  }

  const socioeconomico: EstadoSeccion = !d.socioeconomico.permiso
    ? { estado: "sin-acceso" }
    : d.socioeconomico.ficha
      ? { estado: "si" }
      : { estado: "falta" };

  let documentos: EstadoSeccion;
  if (!d.documentos.permiso) {
    documentos = { estado: "sin-acceso" };
  } else if (d.documentos.lista.length === 0) {
    documentos = { estado: "falta" };
  } else {
    const presentes = new Set(d.documentos.lista.map((doc) => doc.categoria));
    const faltan = d.documentos.categoriasRequeridas
      .filter((r) => !presentes.has(r.categoria))
      .map((r) => r.faltante);
    const vencidos = d.documentos.lista.filter((doc) => !doc.vigente).length;
    if (vencidos > 0) {
      faltan.push(vencidos === 1 ? "renovar 1 documento vencido" : `renovar ${vencidos} documentos vencidos`);
    }
    documentos = conFaltantes(faltan);
  }

  let terapia: EstadoSeccion;
  if (!d.plan.permiso) {
    terapia = { estado: "sin-acceso" };
  } else if (!d.plan.ficha) {
    terapia = { estado: "falta" };
  } else {
    const faltan: string[] = [];
    if (!d.plan.ficha.activo) faltan.push("reactivar el plan (está suspendido)");
    if (d.plan.responsables === 0) faltan.push("equipo responsable");
    terapia = conFaltantes(faltan);
  }

  const avances: EstadoSeccion = !d.avances.permiso
    ? { estado: "sin-acceso" }
    : d.avances.total > 0
      ? { estado: "si" }
      : { estado: "falta" };

  return {
    generales: conFaltantes(faltanGenerales),
    terapias: d.terapias > 0 ? { estado: "si" } : { estado: "falta" },
    fotografias,
    inscripciones,
    clinico,
    socioeconomico,
    documentos,
    terapia,
    avances,
    auditoria: { estado: "informativo" },
  };
}

/** Palabra corta que va en el índice: «Sí», «Incompleto» o «Falta». */
export function etiquetaCorta(e: EstadoSeccion): string | null {
  switch (e.estado) {
    case "si":
      return "Sí";
    case "incompleto":
      return "Incompleto";
    case "falta":
      return "Falta";
    case "sin-acceso":
      return "Sin acceso";
    case "informativo":
      return null;
  }
}

/** Frase completa para la cabecera de la tarjeta y el título del enlace. */
export function descripcionEstado(e: EstadoSeccion): string | null {
  switch (e.estado) {
    case "si":
      return "Sí, datos ingresados";
    case "incompleto":
      return `Incompleto: falta ${listar(e.faltan)}`;
    case "falta":
      return "Falta: todavía no se ha ingresado nada";
    case "sin-acceso":
      return "Tu rol no puede consultar este apartado";
    case "informativo":
      return null;
  }
}

function listar(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** Clases del enlace del índice según el estado: lima si hay datos, naranja si no. */
export function claseIndice(e: EstadoSeccion): string {
  switch (e.estado) {
    case "si":
      return "border-lima-fg/25 bg-lima-bg text-lima-fg hover:border-lima-fg";
    case "incompleto":
    case "falta":
      return "border-naranja-fg/25 bg-naranja-bg text-naranja-fg hover:border-naranja-fg";
    case "sin-acceso":
    case "informativo":
      return "border-line bg-surface text-ink hover:border-brand-primary hover:text-brand-primary";
  }
}

/** Chip de confirmación para la cabecera de cada apartado. */
export function ChipCompletitud({ estado }: { estado: EstadoSeccion }) {
  const texto = descripcionEstado(estado);
  if (!texto) return null;
  const tono =
    estado.estado === "si"
      ? "lima"
      : estado.estado === "sin-acceso"
        ? "neutro"
        : "naranja";
  return (
    <Chip tono={tono} className="max-w-md text-left">
      {texto}
    </Chip>
  );
}
