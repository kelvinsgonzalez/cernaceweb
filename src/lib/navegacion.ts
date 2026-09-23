import { PERMISOS, type ClavePermiso } from "@/lib/rbac";

/**
 * Mapa de módulos de la plataforma con el permiso que habilita cada uno. Lo
 * consumen la barra lateral del panel (pantalla grande) y el menú flotante
 * (móvil), así que incluye tanto las secciones del panel como los espacios
 * personales: quien entra como padrino o como familia también necesita ver en
 * el menú a qué tiene acceso.
 */

/** Bandejas que llevan contador de pendientes. La cuenta la hace el layout. */
export type ClaveContador = "solicitudes";

export type Modulo = {
  href: string;
  etiqueta: string;
  icono: string;
  permiso: ClavePermiso;
  grupo: string;
  contador?: ClaveContador;
};

/** Un módulo ya filtrado por permisos, listo para pintar. */
export type ModuloVisible = Omit<Modulo, "permiso" | "contador"> & {
  pendientes: number;
};

export const MODULOS: Modulo[] = [
  {
    href: "/admin",
    etiqueta: "Panel",
    icono: "LayoutDashboard",
    permiso: PERMISOS.PANEL_VER,
    grupo: "General",
  },
  {
    href: "/admin/beneficiarios",
    etiqueta: "Beneficiarios",
    icono: "Users",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Expedientes",
  },
  {
    href: "/admin/inscripciones",
    etiqueta: "Inscripciones",
    icono: "ClipboardList",
    permiso: PERMISOS.INSCRIPCIONES_LEER,
    grupo: "Expedientes",
  },
  {
    href: "/admin/terapeutas",
    etiqueta: "Terapeutas",
    icono: "Stethoscope",
    permiso: PERMISOS.TERAPEUTAS_LEER,
    grupo: "Expedientes",
  },
  {
    href: "/admin/campanas",
    etiqueta: "Campañas",
    icono: "Megaphone",
    permiso: PERMISOS.DONACIONES_LEER,
    grupo: "Recaudación",
  },
  {
    href: "/admin/donaciones",
    etiqueta: "Donaciones",
    icono: "HandCoins",
    permiso: PERMISOS.DONACIONES_LEER,
    grupo: "Recaudación",
  },
  {
    href: "/admin/donantes",
    etiqueta: "Donantes y padrinos",
    icono: "HeartHandshake",
    permiso: PERMISOS.PADRINOS_GESTIONAR,
    grupo: "Recaudación",
  },
  {
    href: "/admin/asignaciones",
    etiqueta: "Asignaciones",
    icono: "HeartHandshake",
    permiso: PERMISOS.PADRINAZGOS_GESTIONAR,
    grupo: "Recaudación",
  },
  {
    href: "/admin/voluntarios",
    etiqueta: "Voluntarios",
    icono: "UserPlus",
    permiso: PERMISOS.CONTACTO_ATENDER,
    grupo: "Recaudación",
  },
  {
    href: "/admin/solicitudes",
    etiqueta: "Solicitudes",
    icono: "Inbox",
    permiso: PERMISOS.SOLICITUDES_ATENDER,
    grupo: "Entrantes",
    contador: "solicitudes",
  },
  {
    href: "/admin/mensajes",
    etiqueta: "Mensajes",
    icono: "Mail",
    permiso: PERMISOS.CONTACTO_ATENDER,
    grupo: "Entrantes",
  },
  {
    href: "/admin/historias",
    etiqueta: "Historias",
    icono: "Sparkles",
    permiso: PERMISOS.CONTENIDO_GESTIONAR,
    grupo: "Contenido",
  },
  {
    href: "/admin/blog",
    etiqueta: "Blog",
    icono: "Newspaper",
    permiso: PERMISOS.CONTENIDO_GESTIONAR,
    grupo: "Contenido",
  },
  {
    href: "/admin/usuarios",
    etiqueta: "Usuarios y roles",
    icono: "ShieldCheck",
    permiso: PERMISOS.USUARIOS_GESTIONAR,
    grupo: "Administración",
  },
  {
    href: "/admin/configuracion",
    etiqueta: "Configuración",
    icono: "Settings",
    permiso: PERMISOS.USUARIOS_GESTIONAR,
    grupo: "Administración",
  },
  {
    href: "/admin/auditoria",
    etiqueta: "Auditoría",
    icono: "ChartLine",
    permiso: PERMISOS.AUDITORIA_LEER,
    grupo: "Administración",
  },
  {
    href: "/portal",
    etiqueta: "Mis apadrinados",
    icono: "HeartHandshake",
    permiso: PERMISOS.PORTAL_PADRINO,
    grupo: "Mi cuenta",
  },
  {
    href: "/portal/aportes",
    etiqueta: "Mis aportes",
    icono: "HandCoins",
    permiso: PERMISOS.PORTAL_PADRINO,
    grupo: "Mi cuenta",
  },
  {
    href: "/mi-expediente",
    etiqueta: "Mi expediente",
    icono: "FolderOpen",
    permiso: PERMISOS.PORTAL_BENEFICIARIO,
    grupo: "Mi cuenta",
  },
];

/**
 * Los módulos que esta persona puede abrir, con el número de pendientes ya
 * resuelto. Devuelve datos planos a propósito: el menú flotante es componente
 * de cliente y recibe esta lista como prop.
 */
export function modulosVisibles(
  permisos: string[],
  contadores?: Partial<Record<ClaveContador, number>>,
): ModuloVisible[] {
  return MODULOS.filter((m) => permisos.includes(m.permiso)).map((m) => ({
    href: m.href,
    etiqueta: m.etiqueta,
    icono: m.icono,
    grupo: m.grupo,
    pendientes: m.contador ? (contadores?.[m.contador] ?? 0) : 0,
  }));
}

/**
 * Agrupa conservando el orden de la lista: `MODULOS` ya está escrito por
 * grupos, así que no hace falta una segunda constante con el orden que
 * habría que mantener sincronizada a mano.
 */
export function agruparModulos(
  modulos: ModuloVisible[],
): { grupo: string; items: ModuloVisible[] }[] {
  const orden = [...new Set(modulos.map((m) => m.grupo))];
  return orden.map((grupo) => ({
    grupo,
    items: modulos.filter((m) => m.grupo === grupo),
  }));
}
