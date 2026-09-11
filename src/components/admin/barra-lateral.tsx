"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconoNav } from "@/components/iconos-nav";
import { agruparModulos, type ModuloVisible } from "@/lib/navegacion";
import { cn, rutaActiva } from "@/lib/utils";

/**
 * Barra lateral del panel, solo para pantalla grande: en móvil la navegación la
 * lleva el menú flotante (`MenuFlotante`).
 *
 * Los títulos de grupo son párrafos con aria-labelledby, no encabezados: como
 * <h2> quedarían por delante del <h1> en el esquema del documento.
 */
export function BarraLateral({ modulos }: { modulos: ModuloVisible[] }) {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="p-4">
      {agruparModulos(modulos).map(({ grupo, items }) => {
        const idGrupo = `nav-${grupo.toLowerCase().replace(/\s+/g, "-")}`;

        return (
          <div key={grupo} className="mb-6">
            <p
              id={idGrupo}
              className="rotulo px-3 text-[0.62rem] text-brand-yellow/75"
            >
              {grupo}
            </p>
            <ul aria-labelledby={idGrupo} className="mt-2 space-y-0.5">
              {items.map((modulo) => {
                const Icono = iconoNav(modulo.icono);
                const activo = rutaActiva(ruta, modulo.href);

                return (
                  <li key={modulo.href}>
                    <Link
                      href={modulo.href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors duration-200",
                        activo
                          ? "bg-crema/12 text-crema ring-1 ring-brand-yellow/35"
                          : "text-crema/70 hover:bg-crema/10 hover:text-crema",
                      )}
                    >
                      <Icono aria-hidden="true" className="size-4 shrink-0" />
                      {modulo.etiqueta}
                      {modulo.pendientes > 0 ? (
                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-white">
                          {modulo.pendientes > 99 ? "99+" : modulo.pendientes}
                          <span className="visually-hidden"> sin atender</span>
                        </span>
                      ) : null}
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
