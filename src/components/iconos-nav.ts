import {
  Activity,
  CalendarDays,
  ChartLine,
  ClipboardList,
  FileText,
  FolderOpen,
  HandCoins,
  HeartHandshake,
  House,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Puzzle,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Las secciones se declaran con el nombre del icono en texto para que la lista
 * de navegación siga siendo datos serializables: así el mismo array cruza el
 * límite servidor/cliente hacia el menú flotante sin arrastrar componentes.
 */
const ICONOS: Record<string, LucideIcon> = {
  Activity,
  CalendarDays,
  ChartLine,
  ClipboardList,
  FileText,
  FolderOpen,
  HandCoins,
  HeartHandshake,
  House,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Puzzle,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
};

export function iconoNav(nombre: string): LucideIcon {
  return ICONOS[nombre] ?? LayoutDashboard;
}
