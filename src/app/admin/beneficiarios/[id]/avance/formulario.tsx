"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export function FormularioAvance({
  accion,
  beneficiarioId,
  hoy,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  hoy: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="fecha"
          name="fecha"
          type="date"
          etiqueta="Fecha del avance"
          requerido
          defaultValue={hoy}
          error={e.fecha}
        />
        <CampoTexto
          id="area"
          name="area"
          etiqueta="Área"
          ayuda="Por ejemplo: Terapia física, Educación especial, Trabajo social."
          requerido
          error={e.area}
        />
      </div>

      <CampoTexto
        id="titulo"
        name="titulo"
        etiqueta="Título del avance"
        requerido
        error={e.titulo}
      />

      <CampoArea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción"
        rows={6}
        requerido
        error={e.descripcion}
      />

      <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <input
          id="visibleParaPadrino"
          name="visibleParaPadrino"
          type="checkbox"
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
          {pendiente ? "Guardando…" : "Registrar avance"}
        </Boton>
      </div>
    </form>
  );
}
