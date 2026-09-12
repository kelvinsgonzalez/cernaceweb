"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Lamina = {
  src: string;
  alt: string;
  pie: string;
  /** Con título y texto la lámina lleva un mensaje sobrepuesto a la foto. */
  titulo?: string;
  texto?: string;
};

const INTERVALO = 6000;

/**
 * El desplazamiento real lo hace el contenedor con scroll-snap, así que sin
 * JavaScript las láminas siguen siendo navegables arrastrando. Los controles y
 * el avance automático son mejoras encima de eso.
 */
export function Carrusel({
  laminas,
  className,
  etiqueta = "Programas de CERNACE",
  encuadre = "contain",
}: {
  laminas: Lamina[];
  className?: string;
  etiqueta?: string;
  /** `contain` respeta el encuadre original; `cover` llena la lámina, que es
   *  lo que necesita un mensaje sobrepuesto para tener fondo detrás. */
  encuadre?: "contain" | "cover";
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [detenido, setDetenido] = useState(false);

  const irA = useCallback((indice: number) => {
    const nodo = pista.current;
    if (!nodo) return;
    const destino = (indice + laminas.length) % laminas.length;
    // Se fija el índice aquí y no solo al oír el scroll: el evento puede
    // retrasarse y dejar el pie de foto describiendo otra lámina.
    setActual(destino);
    nodo.scrollTo({ left: nodo.clientWidth * destino, behavior: "smooth" });
  }, [laminas.length]);

  // El índice se deduce de la posición de scroll, de modo que arrastrar con el
  // dedo y pulsar los controles no puedan desincronizarse.
  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;
    let pendiente = 0;
    const alDesplazar = () => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => {
        setActual(Math.round(nodo.scrollLeft / nodo.clientWidth));
      });
    };
    nodo.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      cancelAnimationFrame(pendiente);
      nodo.removeEventListener("scroll", alDesplazar);
    };
  }, []);

  useEffect(() => {
    if (detenido || laminas.length < 2) return;
    const prefiereQuietud = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefiereQuietud) return;

    const id = setInterval(() => irA(actual + 1), INTERVALO);
    return () => clearInterval(id);
  }, [actual, detenido, irA, laminas.length]);

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      role="group"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onMouseEnter={() => setDetenido(true)}
      onMouseLeave={() => setDetenido(false)}
      onFocusCapture={() => setDetenido(true)}
      onBlurCapture={() => setDetenido(false)}
    >
      <div className="relative">
        <div
          ref={pista}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-md)] border border-line bg-surface [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {laminas.map((lamina, indice) => (
            <div
              key={`${indice}-${lamina.src}`}
              className="w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${indice + 1} de ${laminas.length}: ${lamina.pie}`}
              aria-hidden={indice !== actual}
            >
              {/* Por defecto `contain` y no `cover`: son fotos documentales de
                  grupo y un recorte dejaría personas fuera del encuadre. */}
              <div className="relative">
                <Image
                  src={lamina.src}
                  alt={lamina.alt}
                  width={1200}
                  height={900}
                  priority={indice === 0}
                  className={cn(
                    "aspect-[4/3] w-full bg-brand-sky",
                    encuadre === "cover" ? "object-cover" : "object-contain",
                  )}
                />
                {lamina.titulo || lamina.texto ? (
                  // El degradado va debajo del texto y no como fondo suyo: sobre
                  // una foto clara el blanco sin velo se vuelve ilegible.
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark via-brand-dark/85 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
                    {lamina.titulo ? (
                      <h3 className="font-heading text-xl font-semibold text-crema sm:text-2xl">
                        {lamina.titulo}
                      </h3>
                    ) : null}
                    {lamina.texto ? (
                      <p className="medida-lectura mt-2 text-sm text-crema/85 sm:text-base">
                        {lamina.texto}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <BotonPaso
          direccion="anterior"
          onClick={() => irA(actual - 1)}
          className="left-3"
        />
        <BotonPaso
          direccion="siguiente"
          onClick={() => irA(actual + 1)}
          className="right-3"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-brand-dark" aria-live="polite">
          {laminas[actual]?.pie}
        </p>
        <div className="flex shrink-0 gap-2">
          {laminas.map((lamina, indice) => (
            <button
              key={`${indice}-${lamina.src}`}
              type="button"
              onClick={() => irA(indice)}
              aria-current={indice === actual}
              className={cn(
                "size-2.5 rounded-full border border-brand-dark/30 transition-colors",
                indice === actual ? "bg-brand-primary" : "bg-surface",
              )}
            >
              <span className="visually-hidden">
                Ver {lamina.pie}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BotonPaso({
  direccion,
  onClick,
  className,
}: {
  direccion: "anterior" | "siguiente";
  onClick: () => void;
  className?: string;
}) {
  const Icono = direccion === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-brand-dark shadow-sm hover:bg-surface",
        className,
      )}
    >
      <Icono aria-hidden="true" className="size-5" />
      <span className="visually-hidden">
        {direccion === "anterior" ? "Lámina anterior" : "Lámina siguiente"}
      </span>
    </button>
  );
}
