/**
 * Catálogo de roles y permisos: fuente de verdad de la aplicación.
 * El seed inserta exactamente lo que hay aquí, y la matriz de
 * /admin/usuarios se lee de la base, no de este archivo.
 *
 * Al añadir un módulo nuevo, añade primero su permiso aquí.
 */

export const PERMISOS = {
  EXPEDIENTE_LEER: "expediente.leer",
  EXPEDIENTE_ESCRIBIR: "expediente.escribir",
  EXPEDIENTE_CLINICO_LEER: "expediente.clinico.leer",
  EXPEDIENTE_CLINICO_ESCRIBIR: "expediente.clinico.escribir",
  EXPEDIENTE_SOCIOECONOMICO_LEER: "expediente.socioeconomico.leer",
  EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR: "expediente.socioeconomico.escribir",
  DOCUMENTOS_LEER: "documentos.leer",
  DOCUMENTOS_SUBIR: "documentos.subir",
  SEGUIMIENTO_LEER: "seguimiento.leer",
  SEGUIMIENTO_ESCRIBIR: "seguimiento.escribir",
  DONACIONES_LEER: "donaciones.leer",
  USUARIOS_GESTIONAR: "usuarios.gestionar",
  AUDITORIA_LEER: "auditoria.leer",
  PORTAL_PADRINO: "portal.padrino",
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
    clave: PERMISOS.DONACIONES_LEER,
    nombre: "Leer donaciones",
    descripcion: "Consultar donaciones, donantes y campañas.",
    modulo: "Donaciones",
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
];

export const ROLES = {
  ADMIN: "ADMIN",
  DIRECCION: "DIRECCION",
  TRABAJO_SOCIAL: "TRABAJO_SOCIAL",
  TERAPEUTA: "TERAPEUTA",
  PADRINO: "PADRINO",
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
    descripcion: "Solo lectura, incluida la auditoría. Sin gestión de usuarios.",
    permisos: [
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
      PERMISOS.DOCUMENTOS_LEER,
      PERMISOS.SEGUIMIENTO_LEER,
      PERMISOS.DONACIONES_LEER,
      PERMISOS.AUDITORIA_LEER,
    ],
  },
  {
    clave: ROLES.TRABAJO_SOCIAL,
    nombre: "Trabajo social",
    descripcion:
      "Expediente completo. Edita la ficha socioeconómica y los avances.",
    permisos: [
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_ESCRIBIR,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
      PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
      PERMISOS.DOCUMENTOS_LEER,
      PERMISOS.DOCUMENTOS_SUBIR,
      PERMISOS.SEGUIMIENTO_LEER,
      PERMISOS.SEGUIMIENTO_ESCRIBIR,
    ],
  },
  {
    clave: ROLES.TERAPEUTA,
    nombre: "Terapeuta",
    descripcion:
      "Área clínica (lectura y escritura) y avances. Sin ficha socioeconómica.",
    permisos: [
      PERMISOS.EXPEDIENTE_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_LEER,
      PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
      PERMISOS.DOCUMENTOS_LEER,
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
];

/** Permisos de un rol según el catálogo (usado por el seed y por las pruebas). */
export function permisosDeRol(clave: ClaveRol): ClavePermiso[] {
  return CATALOGO_ROLES.find((r) => r.clave === clave)?.permisos ?? [];
}

export function nombreDeRol(clave: string): string {
  return CATALOGO_ROLES.find((r) => r.clave === clave)?.nombre ?? clave;
}
