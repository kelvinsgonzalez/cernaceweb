"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartLine,
  FileText,
  HandCoins,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Puzzle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { GRUPOS, SECCIONES } from "./navegacion";
import { cn } from "@/lib/utils";

const ICONOS: Record<string, LucideIcon> = {
  CalendarDays,
  ChartLine,
  FileText,
  HandCoins,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Puzzle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
};

/**
 * `variante` distingue la copia de escritorio de la de móvil: sin ella los dos
 * <nav> compartirían los mismos id y el mismo aria-label.
 *
 * Los títulos de grupo no son encabezados: rotularlos con <h2> los colocaría
 * en el esquema del documento por delante del <h1> de la página. Se usan
 * párrafos referenciados con aria-labelledby desde cada lista.
 */
export function BarraLateral({
  permisos,
  variante = "escritorio",
}: {
  permisos: string[];
  variante?: "escritorio" | "movil";
}) {
  const ruta = usePathname();
  const visibles = SECCIONES.filter((s) => permisos.includes(s.permiso));

  return (
    <nav
      aria-label={
        variante === "movil"
          ? "Secciones del panel (versión compacta)"
          : "Secciones del panel"
      }
      className="p-4"
    >
      {GRUPOS.map((grupo) => {
        const items = visibles.filter((s) => s.grupo === grupo);
        if (items.length === 0) return null;

        const idGrupo = `nav-${variante}-${grupo.toLowerCase()}`;

        return (
          <div key={grupo} className="mb-6">
            <p
              id={idGrupo}
              className="px-3 text-xs font-semibold uppercase tracking-wide text-white/50"
            >
              {grupo}
            </p>
            <ul aria-labelledby={idGrupo} className="mt-2 space-y-0.5">
              {items.map((seccion) => {
                const Icono = ICONOS[seccion.icono] ?? LayoutDashboard;
                const activo =
                  seccion.href === "/admin"
                    ? ruta === "/admin"
                    : ruta.startsWith(seccion.href);

                return (
                  <li key={seccion.href}>
                    <Link
                      href={seccion.href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                        activo
                          ? "bg-white/15 text-white"
                          : "text-white/75 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icono aria-hidden="true" className="size-4 shrink-0" />
                      {seccion.etiqueta}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
