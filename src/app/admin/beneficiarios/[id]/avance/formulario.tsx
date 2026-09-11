"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresAvance = {
  fecha: string;
  area: string;
  titulo: string;
  descripcion: string;
  visibleParaPadrino: boolean;
};

/**
 * Registrar un avance y corregirlo son el mismo formulario. Al corregir, las
 * fotos que se elijan se suman a las que ya tenía: las anteriores se quitan
 * una a una desde el expediente, no vaciando el campo.
 */
export function FormularioAvance({
  accion,
  beneficiarioId,
  avanceId,
  hoy,
  maximoFotos,
  valores,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  /** Presente al corregir un avance ya registrado. */
  avanceId?: string;
  hoy: string;
  maximoFotos: number;
  valores?: ValoresAvance;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const corrigiendo = Boolean(avanceId);

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
      {avanceId ? (
        <input type="hidden" name="avanceId" value={avanceId} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="fecha"
          name="fecha"
          type="date"
          etiqueta="Fecha del avance"
          requerido
          defaultValue={valores?.fecha ?? hoy}
          error={e.fecha}
        />
        <CampoTexto
          id="area"
          name="area"
          etiqueta="Área"
          ayuda="Por ejemplo: Terapia física, Educación especial, Trabajo social."
          requerido
          defaultValue={valores?.area}
          error={e.area}
        />
      </div>

      <CampoTexto
        id="titulo"
        name="titulo"
        etiqueta="Título del avance"
        requerido
        defaultValue={valores?.titulo}
        error={e.titulo}
      />

      <CampoArea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción"
        rows={6}
        requerido
        defaultValue={valores?.descripcion}
        error={e.descripcion}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fotos" className="text-sm font-semibold text-ink">
          {corrigiendo ? "Añadir más fotos" : "Fotos del avance"}
        </label>
        <p id="fotos-ayuda" className="text-xs text-ink-soft">
          Hasta {maximoFotos} imágenes JPG, PNG o WebP de 5 MB como máximo cada
          una. Las fotos no quedan en una dirección pública: solo las ve el
          equipo y, si marcas el avance como visible, el padrino.
        </p>
        <input
          id="fotos"
          name="fotos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={
            e.fotos ? "fotos-ayuda fotos-error" : "fotos-ayuda"
          }
          aria-invalid={e.fotos ? true : undefined}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {e.fotos ? (
          <p id="fotos-error" role="alert" className="text-xs font-medium text-danger">
            {e.fotos}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <input
          id="visibleParaPadrino"
          name="visibleParaPadrino"
          type="checkbox"
          defaultChecked={valores?.visibleParaPadrino}
          className="mt-1 size-4 rounded border-line"
        />
        <label
          htmlFor="visibleParaPadrino"
          className="medida-lectura text-sm text-ink"
        >
          <span className="font-semibold">Visible para el padrino.</span> Si lo
          marcas, este avance aparecerá en el portal del padrino asignado. Deja
          la casilla vacía para las notas internas del equipo.
        </label>
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? "Guardando…"
            : corrigiendo
              ? "Guardar los cambios"
              : "Registrar avance"}
        </Boton>
      </div>
    </form>
  );
}
