"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { MAXIMO_RESUMEN, MAXIMO_TITULO } from "@/lib/campanas";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

export type ValoresCampana = {
  id: string;
  titulo: string;
  resumen: string;
  descripcion: string;
  meta: string;
  fechaInicio: string;
  fechaFin: string;
  general: boolean;
};

/**
 * El mismo formulario para crear y para corregir. La general no tiene meta ni
 * fecha límite: esos campos no se muestran.
 */
export function FormularioCampana({
  accion,
  valores,
  hoy,
}: {
  accion: Accion;
  valores?: ValoresCampana;
  hoy: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const edicion = Boolean(valores);
  const general = valores?.general ?? false;

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      {valores ? <input type="hidden" name="id" value={valores.id} /> : null}

      <CampoTexto
        id="titulo"
        name="titulo"
        etiqueta="Título"
        ayuda={`Corto y claro: hasta ${MAXIMO_TITULO} caracteres, para que quepa en la tarjeta.`}
        requerido
        maxLength={MAXIMO_TITULO}
        defaultValue={valores?.titulo ?? ""}
        error={e.titulo}
        autoComplete="off"
      />

      <CampoArea
        id="resumen"
        name="resumen"
        etiqueta="Descripción corta"
        ayuda={`La frase que sale en la portada. Hasta ${MAXIMO_RESUMEN} caracteres.`}
        requerido
        rows={2}
        maxLength={MAXIMO_RESUMEN}
        defaultValue={valores?.resumen ?? ""}
        error={e.resumen}
      />

      <CampoArea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción completa (opcional)"
        ayuda="Lo que se lee al abrir la campaña para aportar."
        rows={4}
        maxLength={2000}
        defaultValue={valores?.descripcion ?? ""}
        error={e.descripcion}
      />

      {general ? (
        <input type="hidden" name="meta" value="1" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          <CampoTexto
            id="meta"
            name="meta"
            type="number"
            min={1}
            step="0.01"
            etiqueta="Monto esperado (Q)"
            requerido
            defaultValue={valores?.meta ?? ""}
            error={e.meta}
          />
          <CampoTexto
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            etiqueta="Inicia el"
            requerido
            defaultValue={valores?.fechaInicio ?? hoy}
            error={e.fechaInicio}
          />
          <CampoTexto
            id="fechaFin"
            name="fechaFin"
            type="date"
            etiqueta="Fecha límite"
            requerido
            defaultValue={valores?.fechaFin ?? ""}
            error={e.fechaFin}
          />
        </div>
      )}
      {general ? (
        <>
          <input type="hidden" name="fechaInicio" value={valores?.fechaInicio ?? hoy} />
          <input type="hidden" name="fechaFin" value={valores?.fechaInicio ?? hoy} />
        </>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fotos" className="text-sm font-semibold text-ink">
          {edicion ? "Añadir fotos" : "Fotos"}
        </label>
        <p id="fotos-ayuda" className="medida-lectura text-xs text-ink-soft">
          Hasta seis por envío, en JPG, PNG o WebP de 5 MB como máximo. Salen
          en la sección Donaciones de la portada.
        </p>
        <input
          id="fotos"
          name="fotos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={e.fotos ? "fotos-ayuda fotos-error" : "fotos-ayuda"}
          aria-invalid={e.fotos ? true : undefined}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {e.fotos ? (
          <p id="fotos-error" role="alert" className="text-xs font-medium text-danger">
            {e.fotos}
          </p>
        ) : null}
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : edicion ? "Guardar cambios" : "Crear campaña"}
        </Boton>
      </div>
    </form>
  );
}
