import Link from "next/link";
import { ChartNoAxesColumn, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Los conteos del listado, plegados en un botón pequeño junto a «Nuevo
 * expediente». Cada fila del panel es a la vez el número y el filtro: tocar
 * «Sin padrino» deja en la tabla solo a esos niños, para ver quiénes son.
 *
 * Misma técnica Popover sin JavaScript que el menú de acciones.
 */

export type ClaveAlerta =
  | "con-padrino"
  | "sin-padrino"
  | "incompletos"
  | "sin-terapia";

export type FilaResumen = {
  clave: ClaveAlerta | null;
  etiqueta: string;
  valor: number;
  /** Aclaración corta bajo la etiqueta. */
  detalle?: string;
  tono?: "normal" | "aviso";
};

export function ResumenBeneficiarios({
  filas,
  activa,
}: {
  filas: FilaResumen[];
  activa: ClaveAlerta | null;
}) {
  const panel = "resumen-beneficiarios";
  return (
    <>
      <button
        type="button"
        popoverTarget={panel}
        className="menu-disparador inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand-primary hover:text-brand-primary"
      >
        <ChartNoAxesColumn aria-hidden="true" className="size-4" />
        Resumen
      </button>

      <div id={panel} popover="auto" className="menu-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line px-2 pb-2">
          <p className="truncate text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Resumen de expedientes
          </p>
          <button
            type="button"
            popoverTarget={panel}
            popoverTargetAction="hide"
            aria-label="Cerrar el resumen"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-brand-sky hover:text-brand-dark"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <ul className="flex flex-col gap-1 pt-2">
          {filas.map((fila) => {
            const esActiva = fila.clave === activa;
            const href = fila.clave
              ? `/admin/beneficiarios?alerta=${fila.clave}`
              : "/admin/beneficiarios";
            return (
              <li key={fila.clave ?? "total"}>
                <Link
                  href={href}
                  aria-current={esActiva ? "true" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition",
                    esActiva
                      ? "bg-brand-sky text-brand-dark"
                      : "text-ink hover:bg-brand-sky hover:text-brand-dark",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {esActiva ? (
                      <Check aria-hidden="true" className="size-4 shrink-0" />
                    ) : null}
                    <span>
                      <span className="block font-semibold">{fila.etiqueta}</span>
                      {fila.detalle ? (
                        <span className="block text-xs font-normal text-ink-soft">
                          {fila.detalle}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-heading text-lg font-semibold tabular-nums",
                      fila.tono === "aviso" && fila.valor > 0
                        ? "text-warn-fg"
                        : "",
                    )}
                  >
                    {fila.valor}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="px-3 pt-2 text-xs text-ink-soft">
          Toca una fila para dejar en la tabla solo esos expedientes.
        </p>
      </div>
    </>
  );
}
