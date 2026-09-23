"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Boton, EnlaceBoton } from "@/components/ui";

/**
 * El enlace público de una campaña y los botones para mandarlo a las redes.
 * Cada red recibe el enlace por su propia URL de compartir; no hace falta
 * ninguna clave ni SDK. «Copiar» usa el portapapeles del navegador y, si el
 * teléfono lo permite, «Compartir…» abre la hoja nativa.
 */
export function CompartirCampana({
  url,
  titulo,
  resumen,
}: {
  url: string;
  titulo: string;
  resumen: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [puedeCompartir] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
  );

  const texto = `Aporta a «${titulo}» de CERNACE. ${resumen}`.trim();
  const redes = [
    {
      nombre: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
    },
    {
      nombre: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      nombre: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
    },
  ];

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles (http sin https, permisos): el campo queda
      // seleccionable para copiar a mano.
      window.prompt("Copia el enlace:", url);
    }
  }

  async function compartir() {
    try {
      await navigator.share({ title: titulo, text: texto, url });
    } catch {
      // El usuario cerró la hoja: no es un error.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="enlace-campana"
          className="text-xs font-semibold uppercase tracking-wide text-ink-soft"
        >
          Enlace público
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="enlace-campana"
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 font-mono text-xs text-ink"
          />
          <Boton
            type="button"
            variante="contorno"
            onClick={copiar}
            className="shrink-0 px-3 py-2 text-xs"
            aria-live="polite"
          >
            {copiado ? (
              <>
                <Check aria-hidden="true" className="size-4 text-brand-green" />
                Copiado
              </>
            ) : (
              <>
                <Copy aria-hidden="true" className="size-4" />
                Copiar
              </>
            )}
          </Boton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {redes.map((red) => (
          <a
            key={red.nombre}
            href={red.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand-primary hover:text-brand-primary"
          >
            <Share2 aria-hidden="true" className="size-3.5" />
            {red.nombre}
          </a>
        ))}
        {puedeCompartir ? (
          <button
            type="button"
            onClick={compartir}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand-primary hover:text-brand-primary"
          >
            <Share2 aria-hidden="true" className="size-3.5" />
            Compartir…
          </button>
        ) : null}
      </div>

      <EnlaceBoton
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variante="suave"
        className="self-start px-3 py-1.5 text-xs"
      >
        <ExternalLink aria-hidden="true" className="size-3.5" />
        Ver cómo la ven los donantes
      </EnlaceBoton>
    </div>
  );
}
