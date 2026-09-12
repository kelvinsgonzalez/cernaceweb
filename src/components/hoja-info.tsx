import type { ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ficha que se abre encima de la página al tocar su botón, sin una línea de
 * JavaScript: la Popover API del navegador pone la capa superior, el fondo
 * atenuado, el cierre al tocar fuera y el cierre con Esc.
 *
 * Sirve para textos largos que no deben empujar el contenido principal —los
 * compromisos del apadrinamiento, las formas de colaborar— y que aun así
 * tienen que estar en el HTML: el panel viaja siempre completo y, si el
 * navegador no soporta la API, se queda a la vista como una tarjeta normal.
 *
 * El aspecto (hoja que sube en el teléfono, tarjeta centrada con scroll propio
 * en pantalla grande) está en `.hoja-info`, en globals.css.
 */
export function HojaInfo({
  id,
  etiqueta,
  resumen,
  icono,
  titulo,
  entradilla,
  pie,
  children,
}: {
  /** Único en la página: de él salen los id del panel y del encabezado. */
  id: string;
  /** Texto del botón. */
  etiqueta: string;
  /** Media línea bajo el botón: qué va a encontrar quien lo abra. */
  resumen: string;
  icono: ReactNode;
  /** Encabezado del panel. */
  titulo: string;
  entradilla?: string;
  pie?: ReactNode;
  children: ReactNode;
}) {
  const panel = `hoja-${id}`;
  const encabezado = `hoja-${id}-titulo`;

  return (
    <>
      <button
        type="button"
        popoverTarget={panel}
        className={cn(
          "menu-disparador tarjeta-viva group flex w-full items-center gap-4 rounded-[var(--radius-md)]",
          "border border-line bg-surface p-4 text-left shadow-suave",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary">
          {icono}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-base font-semibold text-ink">
            {etiqueta}
          </span>
          <span className="block text-sm text-ink-soft">{resumen}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-ink-soft transition-transform duration-300 ease-suave group-hover:translate-x-1 group-hover:text-brand-primary"
        />
      </button>

      <div
        id={panel}
        popover="auto"
        role="dialog"
        aria-labelledby={encabezado}
        className="hoja-info"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <div>
            <h3
              id={encabezado}
              className="font-heading text-xl font-semibold text-ink sm:text-2xl"
            >
              {titulo}
            </h3>
            {entradilla ? (
              <p className="mt-1 text-sm text-ink-soft">{entradilla}</p>
            ) : null}
          </div>
          <button
            type="button"
            popoverTarget={panel}
            popoverTargetAction="hide"
            aria-label="Cerrar"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand-primary hover:text-brand-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="hoja-info-cuerpo px-5 py-5 sm:px-7">{children}</div>

        {pie ? (
          <div className="border-t border-line bg-canvas px-5 py-4 sm:px-7">
            {pie}
          </div>
        ) : null}
      </div>
    </>
  );
}

/** Lista numerada o con viñeta, con el mismo ritmo en todas las hojas. */
export function ListaHoja({
  puntos,
  marcadores,
}: {
  puntos: (string | { titulo: string; texto: string })[];
  /** Para los compromisos, que en el acta van numerados o con letra. */
  marcadores?: string[];
}) {
  return (
    <ul className="space-y-3">
      {puntos.map((punto, indice) => {
        const marcador = marcadores?.[indice] ?? `${indice + 1}`;
        return (
          <li
            key={typeof punto === "string" ? punto : punto.titulo}
            className="flex gap-3"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-sky text-xs font-bold text-brand-primary"
            >
              {marcador}
            </span>
            {typeof punto === "string" ? (
              <p className="text-ink-soft">{punto}</p>
            ) : (
              <p className="text-ink-soft">
                <strong className="font-semibold text-ink">
                  {punto.titulo}
                </strong>{" "}
                {punto.texto}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
