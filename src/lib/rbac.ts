/**
 * Fuente de verdad de roles y permisos: el seed inserta exactamente lo que hay
 * aquí. La matriz de /admin/usuarios se lee de la base, no de este archivo.
 */

export const PERMISOS = {
  PANEL_VER: "panel.ver",
  EXPEDIENTE_LEER: "expediente.leer",
  EXPEDIENTE_ESCRIBIR: "expediente.escribir",
  EXPEDIENTE_CLINICO_LEER: "expediente.clinico.leer",
  EXPEDIENTE_CLINICO_ESCRIBIR: "expediente.clinico.escribir",
  EXPEDIENTE_SOCIOECONOMICO_LEER: "expediente.socioeconomico.leer",
  EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR: "expediente.socioeconomico.escribir",
  BENEFICIARIO_ACCESO: "beneficiario.acceso",
  INSCRIPCIONES_LEER: "inscripciones.leer",
  DOCUMENTOS_LEER: "documentos.leer",
  DOCUMENTOS_SUBIR: "documentos.subir",
  SEGUIMIENTO_LEER: "seguimiento.leer",
  SEGUIMIENTO_ESCRIBIR: "seguimiento.escribir",
  TERAPIA_GESTIONAR: "terapia.gestionar",
  TERAPEUTAS_LEER: "terapeutas.leer",
  TERAPEUTAS_GESTIONAR: "terapeutas.gestionar",
  DONACIONES_LEER: "donaciones.leer",
  DONACIONES_GESTIONAR: "donaciones.gestionar",
  PADRINAZGOS_GESTIONAR: "padrinazgos.gestionar",
  PADRINOS_GESTIONAR: "padrinos.gestionar",
  GALERIA_PUBLICAR: "galeria.publicar",
  SOLICITUDES_ATENDER: "solicitudes.atender",
  CONTACTO_ATENDER: "contacto.atender",
  CONTENIDO_GESTIONAR: "contenido.gestionar",
  USUARIOS_GESTIONAR: "usuarios.gestionar",
  AUDITORIA_LEER: "auditoria.leer",
  PORTAL_PADRINO: "portal.padrino",
  PORTAL_BENEFICIARIO: "portal.beneficiario",
} as const;

export type ClavePermiso = (typeof PERMISOS)[keyof typeof PERMISOS];

type DefinicionPermiso = {
  clave: ClavePermiso;
  nombre: string;
  descripcion: string;
  modulo: string;
};

export const CATALOGO_PERMISOS: DefinicionPermiso[] = [
  {
    clave: PERMISOS.PANEL_VER,
    nombre: "Ver el panel general",
    descripcion:
      "Abrir la portada del panel con los indicadores y los últimos avances. Sin este permiso se entra directo al primer módulo disponible.",
    modulo: "General",
  },
  {
    clave: PERMISOS.EXPEDIENTE_LEER,
    nombre: "Leer expedientes",
    descripcion: "Consultar el listado y los datos generales de los beneficiarios.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.EXPEDIENTE_ESCRIBIR,
    nombre: "Editar expedientes",
    descripcion: "Crear y modificar los datos generales del expediente.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.EXPEDIENTE_CLINICO_LEER,
    nombre: "Leer expediente clínico",
    descripcion: "Ver diagnóstico, terapias y evaluaciones clínicas.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
    nombre: "Editar expediente clínico",
    descripcion: "Registrar diagnóstico, terapias y evaluaciones.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
    nombre: "Leer ficha socioeconómica",
    descripcion: "Ver ingresos del hogar, vivienda y nivel de vulnerabilidad.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
    nombre: "Editar ficha socioeconómica",
    descripcion: "Registrar el estudio socioeconómico del hogar.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.BENEFICIARIO_ACCESO,
    nombre: "Dar acceso al expediente propio",
    descripcion:
      "Crear la cuenta con la que la familia consulta su propio expediente, sin poder administrar el resto de cuentas.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.INSCRIPCIONES_LEER,
    nombre: "Leer inscripciones",
    descripcion: "Consultar el ciclo de inscripciones y a quién falta inscribir.",
    modulo: "Expedientes",
  },
  {
    clave: PERMISOS.DOCUMENTOS_LEER,
    nombre: "Leer documentos",
    descripcion: "Consultar los documentos adjuntos al expediente.",
    modulo: "Documentos",
  },
  {
    clave: PERMISOS.DOCUMENTOS_SUBIR,
    nombre: "Subir documentos",
    descripcion: "Adjuntar documentos al expediente.",
    modulo: "Documentos",
  },
  {
    clave: PERMISOS.SEGUIMIENTO_LEER,
    nombre: "Leer avances",
    descripcion: "Consultar los avances registrados por el personal.",
    modulo: "Seguimiento",
  },
  {
    clave: PERMISOS.SEGUIMIENTO_ESCRIBIR,
    nombre: "Registrar avances",
    descripcion: "Añadir avances y decidir si el padrino puede verlos.",
    modulo: "Seguimiento",
  },
  {
    clave: PERMISOS.TERAPIA_GESTIONAR,
    nombre: "Aprobar y asignar terapia",
    descripcion:
      "Autorizar que un beneficiario reciba terapia, fijar su objetivo general y designar a los responsables.",
    modulo: "Seguimiento",
  },
  {
    clave: PERMISOS.TERAPEUTAS_LEER,
    nombre: "Ver el equipo terapéutico",
    descripcion:
      "Consultar la lista de terapeutas, su ficha y los casos que llevan, sin tocar sus cuentas.",
    modulo: "Seguimiento",
  },
  {
    clave: PERMISOS.TERAPEUTAS_GESTIONAR,
    nombre: "Gestionar el equipo terapéutico",
    descripcion:
      "Dar de alta terapeutas, corregir sus datos, restablecer su contraseña y darlos de baja. Solo alcanza a las cuentas de terapeuta.",
    modulo: "Seguimiento",
  },
  {
    clave: PERMISOS.DONACIONES_LEER,
    nombre: "Leer donaciones",
    descripcion: "Consultar donaciones, donantes y campañas.",
    modulo: "Donaciones",
  },
  {
    clave: PERMISOS.DONACIONES_GESTIONAR,
    nombre: "Verificar donaciones",
    descripcion:
      "Cotejar la boleta de una transferencia o un depósito y dar la donación por buena o rechazarla.",
    modulo: "Donaciones",
  },
  {
    clave: PERMISOS.PADRINAZGOS_GESTIONAR,
    nombre: "Asignar padrinazgos",
    descripcion:
      "Asignar un beneficiario a un padrino y dar por terminada la asignación.",
    modulo: "Padrinos",
  },
  {
    clave: PERMISOS.PADRINOS_GESTIONAR,
    nombre: "Gestionar padrinos",
    descripcion:
      "Dar de alta una ficha de padrino, corregir sus datos de contacto, darle acceso al portal y darla de baja.",
    modulo: "Padrinos",
  },
  {
    clave: PERMISOS.GALERIA_PUBLICAR,
    nombre: "Publicar en el sitio público",
    descripcion:
      "Autorizar que los datos generales y la foto de un beneficiario salgan en la página pública para buscarle patrocinador.",
    modulo: "Padrinos",
  },
  {
    clave: PERMISOS.SOLICITUDES_ATENDER,
    nombre: "Atender solicitudes de apoyo",
    descripcion:
      "Revisar y cambiar el estado de las solicitudes de apoyo que llegan del formulario público.",
    modulo: "Entrantes",
  },
  {
    clave: PERMISOS.CONTACTO_ATENDER,
    nombre: "Atender mensajes y voluntariado",
    descripcion:
      "Revisar y cambiar el estado de los mensajes de contacto y las postulaciones de voluntariado.",
    modulo: "Entrantes",
  },
  {
    clave: PERMISOS.CONTENIDO_GESTIONAR,
    nombre: "Gestionar contenido del sitio",
    descripcion: "Administrar eventos, historias y entradas del blog.",
    modulo: "Contenido",
  },
  {
    clave: PERMISOS.USUARIOS_GESTIONAR,
    nombre: "Gestionar usuarios",
    descripcion: "Administrar cuentas, roles y permisos.",
    modulo: "Administración",
  },
  {
    clave: PERMISOS.AUDITORIA_LEER,
    nombre: "Leer auditoría",
    descripcion: "Consultar la bitácora de accesos y cambios.",
    modulo: "Administración",
  },
  {
    clave: PERMISOS.PORTAL_PADRINO,
    nombre: "Portal del padrino",
    descripcion: "Acceder al portal y ver el progreso del beneficiado.",
    modulo: "Padrinos",
  },
  {
    clave: PERMISOS.PORTAL_BENEFICIARIO,
    nombre: "Expediente propio",
    descripcion:
      "Consultar el propio expediente: avances compartidos y documentos compartidos. Solo lectura.",
    modulo: "Beneficiarios",
  },
];

export const ROLES = {
  ADMIN: "ADMIN",
  DIRECCION: "DIRECCION",
  TRABAJO_SOCIAL: "TRABAJO_SOCIAL",
  TERAPEUTA: "TERAPEUTA",
  PADRINO: "PADRINO",
  BENEFICIARIO: "BENEFICIARIO",
} as const;

export type ClaveRol = (typeof ROLES)[keyof typeof ROLES];

type DefinicionRol = {
  clave: ClaveRol;
  nombre: string;
  descripcion: string;
  permisos: ClavePermiso[];
};

const TODOS_LOS_PERMISOS = CATALOGO_PERMISOS.map((p) => p.clave);

export const CATALOGO_ROLES: DefinicionRol[] = [
  {
    clave: ROLES.ADMIN,
    nombre: "Administrador",
    descripcion: "Control total de la plataforma.",
    permisos: TODOS_LOS_PERMISOS,
  },
  {
    clave: ROLES.DIRECCION,
    nombre: "Dirección",
    descripcion:
      "Da seguimiento a beneficiarios, terapeutas y padrinos: expedientes, asignación de terapia, avances y solicitudes de apoyo. Entra directo a Beneficiarios: sin panel general, cuentas, configuración, recaudación, contenido del sitio ni auditoría.",
    permisos: [
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_ESCRIBIR,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
      PERMISOS.BENEFICIARIO_ACCESO,
      PERMISOS.INSCRIPCIONES_LEER,
      PERMISOS.DOCUMENTOS_LEER,
      PERMISOS.DOCUMENTOS_SUBIR,
      PERMISOS.SEGUIMIENTO_LEER,
      PERMISOS.SEGUIMIENTO_ESCRIBIR,
      PERMISOS.TERAPIA_GESTIONAR,
      PERMISOS.TERAPEUTAS_LEER,
      PERMISOS.PADRINAZGOS_GESTIONAR,
      PERMISOS.PADRINOS_GESTIONAR,
      PERMISOS.GALERIA_PUBLICAR,
      PERMISOS.SOLICITUDES_ATENDER,
    ],
  },
  {
    clave: ROLES.TRABAJO_SOCIAL,
    nombre: "Trabajo social",
    descripcion:
      "Expediente completo. Edita la ficha socioeconómica y los avances.",
    permisos: [
      PERMISOS.PANEL_VER,
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_ESCRIBIR,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
      PERMISOS.INSCRIPCIONES_LEER,
      PERMISOS.DOCUMENTOS_LEER,
      PERMISOS.DOCUMENTOS_SUBIR,
      PERMISOS.SEGUIMIENTO_LEER,
      PERMISOS.SEGUIMIENTO_ESCRIBIR,
      PERMISOS.PADRINAZGOS_GESTIONAR,
      PERMISOS.SOLICITUDES_ATENDER,
      PERMISOS.CONTACTO_ATENDER,
      PERMISOS.CONTENIDO_GESTIONAR,
    ],
  },
  {
    clave: ROLES.TERAPEUTA,
    nombre: "Terapeuta",
    descripcion:
      "Área clínica (lectura y escritura), avances y documentos de sus casos. Sin ficha socioeconómica, sin recaudación y sin contenido del sitio.",
    permisos: [
      PERMISOS.PANEL_VER,
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
      PERMISOS.DOCUMENTOS_LEER,
      PERMISOS.DOCUMENTOS_SUBIR,
      PERMISOS.SEGUIMIENTO_LEER,
      PERMISOS.SEGUIMIENTO_ESCRIBIR,
    ],
  },
  {
    clave: ROLES.PADRINO,
    nombre: "Padrino",
    descripcion: "Únicamente el portal del padrino.",
    permisos: [PERMISOS.PORTAL_PADRINO],
  },
  {
    clave: ROLES.BENEFICIARIO,
    nombre: "Beneficiario",
    descripcion:
      "La familia consultando su propio expediente. Solo lectura, y solo lo compartido.",
    permisos: [PERMISOS.PORTAL_BENEFICIARIO],
  },
];

export function permisosDeRol(clave: ClaveRol): ClavePermiso[] {
  return CATALOGO_ROLES.find((r) => r.clave === clave)?.permisos ?? [];
}

export function nombreDeRol(clave: string): string {
  return CATALOGO_ROLES.find((r) => r.clave === clave)?.nombre ?? clave;
}
