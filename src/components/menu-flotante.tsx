"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MarcaCernace } from "@/components/logo";
import { iconoNav } from "@/components/iconos-nav";
import { agruparModulos, type ModuloVisible } from "@/lib/navegacion";
import { cn, rutaActiva } from "@/lib/utils";

/**
 * Navegación de móvil y tableta: una barra flotante anclada arriba que despliega
 * la lista de módulos a los que llega la persona conectada. Sustituye a la barra
 * lateral del panel y a la cabecera de escritorio por debajo de `lg`, donde esas
 * dos ocupaban media pantalla antes de dejar ver nada de contenido.
 *
 * La lista llega ya filtrada por permisos desde el servidor: aquí no se decide
 * quién ve qué, solo cómo se pinta. Los módulos son datos planos por eso mismo
 * —el icono viaja como nombre— y el pie es un hueco donde el layout mete sus
 * componentes de servidor (el formulario de cerrar sesión, por ejemplo).
 */
export function MenuFlotante({
  titulo,
  subtitulo,
  inicio = "/",
  modulos,
  identidad,
  pie,
}: {
  /** Dónde está la persona: se lee en la barra sin abrir el menú. */
  titulo: string;
  subtitulo?: string;
  /** Destino del azulejo de la marca. */
  inicio?: string;
  modulos: ModuloVisible[];
  identidad?: { nombre: string; detalle?: string };
  pie?: ReactNode;
}) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState(ruta);
  const disparador = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const grupos = agruparModulos(modulos);
  const pendientes = modulos.reduce((suma, m) => suma + m.pendientes, 0);

  // Cerrar a mano devuelve el foco al botón; cerrar por navegación no, porque
  // la página ya cambió y robárselo al contenido nuevo sería peor.
  const cerrar = useCallback(() => {
    setAbierto(false);
    disparador.current?.focus();
  }, []);

  // Ajuste durante el render, no en un efecto: al cambiar de página el panel
  // no llega a pintarse abierto ni un fotograma. Cubre también la vuelta atrás
  // del navegador, que no pasa por el `onClick` de los enlaces.
  if (ruta !== rutaAbierta) {
    setRutaAbierta(ruta);
    setAbierto(false);
  }

  // Mientras está abierto: Esc cierra y el fondo no se desplaza detrás del panel.
  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", alPulsar);

    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = desbordeAnterior;
    };
  }, [abierto, cerrar]);

  return (
    <>
      {/* Reserva el sitio que ocupa la barra flotante: sin esto el primer
          titular de cada página nacería debajo de ella. */}
      <div aria-hidden="true" className="hueco-flotante print:hidden lg:hidden" />

      {abierto ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={cerrar}
          className="velo-menu fixed inset-0 z-40 cursor-default bg-brand-dark/45 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="capa-flotante fixed z-50 print:hidden lg:hidden">
        <div
          className={cn(
            "flex items-center gap-3 border border-line bg-surface/92 px-3 py-2.5 shadow-alta backdrop-blur-md",
            abierto ? "rounded-t-[var(--radius-lg)]" : "rounded-[var(--radius-lg)]",
          )}
        >
          <Link
            href={inicio}
            aria-label="Ir al inicio"
            className="group shrink-0"
          >
            <MarcaCernace className="size-9" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-ink">{titulo}</p>
            {subtitulo ? (
              <p className="truncate text-xs text-ink-soft">{subtitulo}</p>
            ) : null}
          </div>

          <button
            ref={disparador}
            type="button"
            onClick={() => (abierto ? cerrar() : setAbierto(true))}
            aria-expanded={abierto}
            aria-controls="menu-flotante-panel"
            className="relative inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-primary/45 bg-surface px-3.5 py-2 text-sm font-semibold text-brand-dark transition-colors hover:border-brand-primary hover:bg-brand-sky"
          >
            {abierto ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Menu aria-hidden="true" className="size-4" />
            )}
            {abierto ? "Cerrar" : "Menú"}
            {pendientes > 0 && !abierto ? (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger ring-2 ring-surface"
              />
            ) : null}
          </button>
        </div>

        {abierto ? (
          <div
            id="menu-flotante-panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de módulos"
            tabIndex={-1}
            className="panel-flotante overflow-y-auto rounded-b-[var(--radius-lg)] border border-t-0 border-line bg-surface shadow-alta focus:outline-none"
          >
            {identidad ? (
              <div className="border-b border-line bg-canvas px-4 py-3">
                <p className="text-sm font-semibold text-ink">
                  {identidad.nombre}
                </p>
                {identidad.detalle ? (
                  <p className="text-xs text-ink-soft">{identidad.detalle}</p>
                ) : null}
              </div>
            ) : null}

            <nav aria-label="Módulos disponibles" className="px-3 py-3">
              {grupos.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-soft">
                  Tu cuenta todavía no tiene módulos habilitados.
                </p>
              ) : null}

              {grupos.map(({ grupo, items }) => {
                const idGrupo = `menu-grupo-${grupo.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <div key={grupo} className="mb-4 last:mb-0">
                    <p
                      id={idGrupo}
                      className="rotulo px-3 text-[0.6rem] text-ink-soft"
                    >
                      {grupo}
                    </p>
                    <ul aria-labelledby={idGrupo} className="mt-1.5 space-y-0.5">
                      {items.map((modulo) => {
                        const Icono = iconoNav(modulo.icono);
                        const activo = rutaActiva(ruta, modulo.href);

                        return (
                          <li key={modulo.href}>
                            <Link
                              href={modulo.href}
                              aria-current={activo ? "page" : undefined}
                              onClick={() => setAbierto(false)}
                              className={cn(
                                // 44px de alto mínimo: es lo que necesita un dedo.
                                "flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                                activo
                                  ? "bg-brand-sky text-brand-dark ring-1 ring-brand-primary/30"
                                  : "text-ink hover:bg-canvas",
                              )}
                            >
                              <Icono
                                aria-hidden="true"
                                className="size-4 shrink-0 text-brand-primary"
                              />
                              {modulo.etiqueta}
                              {modulo.pendientes > 0 ? (
                                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-white">
                                  {modulo.pendientes > 99
                                    ? "99+"
                                    : modulo.pendientes}
                                  <span className="visually-hidden">
                                    {" "}
                                    sin atender
                                  </span>
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

            {pie ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-4 py-3">
                {pie}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
