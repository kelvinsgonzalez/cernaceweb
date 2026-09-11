import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal, X } from "lucide-react";
import { Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Menú de acciones sin una línea de JavaScript: la Popover API del navegador
 * pone la capa superior, el fondo atenuado y el cierre al tocar fuera o con
 * Esc, así que esto sigue siendo un componente de servidor y los formularios
 * de dentro son los mismos server actions de siempre.
 *
 * Vive en la capa superior por necesidad, no por gusto: dentro de una tabla con
 * scroll horizontal un panel posicionado a mano queda recortado.
 *
 * El aspecto —hoja que sube desde abajo en móvil, tarjeta centrada en pantalla
 * grande— está en `.menu-panel`, en globals.css.
 */
export function MenuAcciones({
  id,
  etiqueta,
  titulo,
  variante = "puntitos",
  children,
}: {
  /** Único en la página: es el id del elemento que abre el botón. */
  id: string;
  /** Lo que oye quien navega con lector de pantalla al llegar al botón. */
  etiqueta: string;
  /** Encabezado del panel: de qué fila son estas acciones. */
  titulo: string;
  variante?: "puntitos" | "texto";
  children: ReactNode;
}) {
  const panel = `menu-${id}`;
  return (
    <>
      <button
        type="button"
        popoverTarget={panel}
        aria-label={variante === "puntitos" ? etiqueta : undefined}
        className={cn(
          "menu-disparador inline-flex items-center justify-center border transition",
          variante === "puntitos"
            ? "size-9 shrink-0 rounded-full border-line bg-surface text-ink-soft hover:border-brand-primary hover:text-brand-primary"
            : "gap-2 rounded-[var(--radius-sm)] border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand-primary hover:text-brand-primary",
        )}
      >
        {variante === "puntitos" ? (
          <MoreHorizontal aria-hidden="true" className="size-4" />
        ) : (
          <>
            {etiqueta}
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </>
        )}
      </button>

      <div id={panel} popover="auto" className="menu-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line px-2 pb-2">
          <p className="truncate text-xs font-semibold tracking-wide text-ink-soft uppercase">
            {titulo}
          </p>
          <button
            type="button"
            popoverTarget={panel}
            popoverTargetAction="hide"
            aria-label="Cerrar el menú"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-brand-sky hover:text-brand-dark"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1 pt-2">{children}</div>
      </div>
    </>
  );
}

const claseOpcion =
  "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm font-semibold transition";

const claseTono = {
  normal: "text-ink hover:bg-brand-sky hover:text-brand-dark",
  peligro: "text-danger hover:bg-danger/10",
};

/** Opción que envía un formulario: envuélvela en su propio `<form>`. */
export function OpcionMenu({
  tono = "normal",
  className,
  ...props
}: ComponentProps<"button"> & { tono?: keyof typeof claseTono }) {
  return (
    <button
      type="submit"
      className={cn(claseOpcion, claseTono[tono], className)}
      {...props}
    />
  );
}

/** Opción que solo navega. */
export function EnlaceMenu({
  tono = "normal",
  className,
  ...props
}: ComponentProps<typeof Link> & { tono?: keyof typeof claseTono }) {
  return (
    <Link className={cn(claseOpcion, claseTono[tono], className)} {...props} />
  );
}

/**
 * Opción que antes de ejecutarse pregunta si de verdad. La confirmación se
 * despliega dentro del propio menú con un <details>: sigue sin hacer falta
 * JavaScript, y evita apilar un segundo panel flotante encima del primero.
 *
 * «Cancelar» cierra el menú entero —es el único cierre que la Popover API deja
 * declarar— y el resumen vuelve a plegarse si se toca otra vez.
 */
export function OpcionConfirmada({
  menu,
  etiqueta,
  mensaje,
  confirmar,
  accion,
  tono = "normal",
  children,
}: {
  /** El mismo `id` que recibió `MenuAcciones`: es el panel que cierra «Cancelar». */
  menu: string;
  etiqueta: string;
  /** Qué va a pasar exactamente si confirma. */
  mensaje: string;
  /** Texto del botón que ejecuta: dice la acción, no «Aceptar». */
  confirmar: string;
  accion: (datos: FormData) => void | Promise<void>;
  tono?: keyof typeof claseTono;
  /** Campos ocultos del formulario, p. ej. el id de la fila. */
  children?: ReactNode;
}) {
  return (
    <details className="group">
      <summary
        className={cn(
          claseOpcion,
          claseTono[tono],
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-90"
        />
        {etiqueta}
      </summary>

      <div className="mt-1 rounded-[var(--radius-sm)] border border-line bg-canvas p-3">
        <p className="text-xs text-ink-soft">{mensaje}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={accion}>
            {children}
            <Boton
              type="submit"
              variante={tono === "peligro" ? "peligro" : "solido"}
              className="px-3 py-1.5 text-xs"
            >
              {confirmar}
            </Boton>
          </form>
          <Boton
            type="button"
            variante="contorno"
            popoverTarget={`menu-${menu}`}
            popoverTargetAction="hide"
            className="px-3 py-1.5 text-xs"
          >
            Cancelar
          </Boton>
        </div>
      </div>
    </details>
  );
}
