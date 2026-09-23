"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Un bloque que se abre con «Ver más» junto a su título. Cerrado ocupa una
 * sola línea, para que lo que viene después (la galería, el carrusel) no
 * quede a dos pantallas de distancia; abierto enseña todo su contenido.
 */
export function SeccionPlegable({
  titulo,
  tituloId,
  acciones,
  abiertoAlInicio = false,
  children,
}: {
  titulo: string;
  tituloId: string;
  /** Lo que va a la derecha del título, p. ej. un botón de llamada. */
  acciones?: ReactNode;
  abiertoAlInicio?: boolean;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const panel = useId();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2
            id={tituloId}
            className="font-heading text-2xl font-semibold text-ink sm:text-3xl"
          >
            {titulo}
          </h2>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls={panel}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
          >
            {abierto ? "Ver menos" : "Ver más"}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform duration-300 ease-suave",
                abierto && "rotate-180",
              )}
            />
          </button>
        </div>
        {acciones}
      </div>

      <div id={panel} hidden={!abierto}>
        {children}
      </div>
    </>
  );
}
