"use client";

import { useActionState } from "react";
import { Boton, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

/**
 * Un formulario por avance. El id del avance va en un campo oculto para que
 * cada hilo escriba en el suyo aunque haya varios en la misma página.
 */
export function FormularioComentario({
  accion,
  seguimientoId,
  titulo,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  seguimientoId: string;
  titulo: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const idCampo = `comentario-${seguimientoId}`;

  return (
    <form action={enviar} className="mt-3 flex flex-col gap-2" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="seguimientoId" value={seguimientoId} />

      <label htmlFor={idCampo} className="visually-hidden">
        Comentario interno sobre el avance «{titulo}»
      </label>
      <div className="flex flex-wrap items-start gap-2">
        <textarea
          id={idCampo}
          name="texto"
          rows={2}
          required
          placeholder="Comenta este avance para el equipo…"
          aria-invalid={e.texto ? true : undefined}
          aria-describedby={e.texto ? `${idCampo}-error` : undefined}
          className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 aria-[invalid=true]:border-danger"
        />
        <Boton
          type="submit"
          variante="contorno"
          disabled={pendiente}
          className="px-3 py-2 text-xs"
        >
          {pendiente ? "Publicando…" : "Comentar"}
        </Boton>
      </div>
      {e.texto ? (
        <p
          id={`${idCampo}-error`}
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {e.texto}
        </p>
      ) : null}
    </form>
  );
}
