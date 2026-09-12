"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Pestana = {
  id: string;
  etiqueta: string;
  icono?: ReactNode;
  contenido: ReactNode;
};

/**
 * Pestañas con el patrón ARIA completo: las flechas recorren la lista, Inicio
 * y Fin saltan a los extremos y la selección sigue al foco.
 *
 * Los paneles que no están activos se quedan en el HTML con `hidden` en vez de
 * desmontarse: así el texto institucional entero viaja en la respuesta del
 * servidor y lo leen igual los buscadores y quien llegue sin JavaScript.
 */
export function Pestanas({
  pestanas,
  etiqueta,
  className,
}: {
  pestanas: Pestana[];
  etiqueta: string;
  className?: string;
}) {
  const base = useId();
  const [activa, setActiva] = useState(pestanas[0]?.id ?? "");
  const botones = useRef(new Map<string, HTMLButtonElement | null>());

  const idBoton = (id: string) => `${base}-pestana-${id}`;
  const idPanel = (id: string) => `${base}-panel-${id}`;

  function irA(indice: number) {
    const destino = pestanas[(indice + pestanas.length) % pestanas.length];
    if (!destino) return;
    setActiva(destino.id);
    botones.current.get(destino.id)?.focus();
  }

  function alTeclado(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const salto: Record<string, number> = {
      ArrowRight: indice + 1,
      ArrowLeft: indice - 1,
      Home: 0,
      End: pestanas.length - 1,
    };
    const destino = salto[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    irA(destino);
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={etiqueta}
        className="inline-flex flex-wrap gap-1.5 rounded-full border border-line bg-surface p-1.5 shadow-suave"
      >
        {pestanas.map((pestana, indice) => {
          const seleccionada = pestana.id === activa;
          return (
            <button
              key={pestana.id}
              type="button"
              role="tab"
              id={idBoton(pestana.id)}
              aria-controls={idPanel(pestana.id)}
              aria-selected={seleccionada}
              tabIndex={seleccionada ? 0 : -1}
              ref={(nodo) => {
                botones.current.set(pestana.id, nodo);
              }}
              onClick={() => setActiva(pestana.id)}
              onKeyDown={(evento) => alTeclado(evento, indice)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ease-suave",
                seleccionada
                  ? "bg-brand-primary text-crema shadow-suave"
                  : "text-ink-soft hover:bg-brand-sky hover:text-brand-primary",
              )}
            >
              {pestana.icono}
              {pestana.etiqueta}
            </button>
          );
        })}
      </div>

      {pestanas.map((pestana) => (
        <div
          key={pestana.id}
          role="tabpanel"
          id={idPanel(pestana.id)}
          aria-labelledby={idBoton(pestana.id)}
          hidden={pestana.id !== activa}
          tabIndex={0}
          className="mt-5 rounded-[var(--radius-md)]"
        >
          {pestana.contenido}
        </div>
      ))}
    </div>
  );
}
