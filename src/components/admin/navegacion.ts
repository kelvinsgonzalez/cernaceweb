import { PERMISOS, type ClavePermiso } from "@/lib/rbac";

/** Las 16 secciones del panel, cada una con el permiso que la habilita. */
export const SECCIONES: {
  href: string;
  etiqueta: string;
  icono: string;
  permiso: ClavePermiso;
  grupo: string;
}[] = [
  {
    href: "/admin",
    etiqueta: "Panel",
    icono: "LayoutDashboard",
    permiso: PERMISOS.EXPEDIENTE_LEER,
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
    href: "/admin/programas",
    etiqueta: "Programas",
    icono: "Puzzle",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Expedientes",
  },
  {
    href: "/admin/documentos",
    etiqueta: "Documentos",
    icono: "FileText",
    permiso: PERMISOS.DOCUMENTOS_LEER,
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
    permiso: PERMISOS.DONACIONES_LEER,
    grupo: "Recaudación",
  },
  {
    href: "/admin/voluntarios",
    etiqueta: "Voluntarios",
    icono: "UserPlus",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Recaudación",
  },
  {
    href: "/admin/solicitudes",
    etiqueta: "Solicitudes",
    icono: "Inbox",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Entrantes",
  },
  {
    href: "/admin/mensajes",
    etiqueta: "Mensajes",
    icono: "Mail",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Entrantes",
  },
  {
    href: "/admin/eventos",
    etiqueta: "Eventos",
    icono: "CalendarDays",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Contenido",
  },
  {
    href: "/admin/historias",
    etiqueta: "Historias",
    icono: "Sparkles",
    permiso: PERMISOS.EXPEDIENTE_LEER,
    grupo: "Contenido",
  },
  {
    href: "/admin/blog",
    etiqueta: "Blog",
    icono: "Newspaper",
    permiso: PERMISOS.EXPEDIENTE_LEER,
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
];

export const GRUPOS = [
  "General",
  "Expedientes",
  "Recaudación",
  "Entrantes",
  "Contenido",
  "Administración",
];
