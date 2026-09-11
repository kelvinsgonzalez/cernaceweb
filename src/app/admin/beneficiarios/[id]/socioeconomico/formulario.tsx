"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresSocio = {
  integrantesHogar: string;
  ingresoMensual: string;
  fuenteIngreso: string;
  tipoVivienda: string;
  materialConstruccion: string;
  escolaridadEncargado: string;
  serviciosBasicos: string;
  observaciones: string;
  nivelVulnerabilidad: string;
  elegibleBeca: boolean;
  fechaEstudio: string;
  realizadoPor: string;
};

export function FormularioSocioeconomico({
  accion,
  beneficiarioId,
  valores,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  valores: ValoresSocio;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-6" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Hogar e ingresos
        </legend>
        <CampoTexto
          id="integrantesHogar"
          name="integrantesHogar"
          type="number"
          min={1}
          etiqueta="Integrantes del hogar"
          requerido
          defaultValue={valores.integrantesHogar}
          error={e.integrantesHogar}
        />
        <CampoTexto
          id="ingresoMensual"
          name="ingresoMensual"
          type="number"
          min={0}
          step="0.01"
          etiqueta="Ingreso mensual (Q)"
          requerido
          defaultValue={valores.ingresoMensual}
          error={e.ingresoMensual}
        />
        <CampoTexto
          id="fuenteIngreso"
          name="fuenteIngreso"
          etiqueta="Fuente del ingreso"
          ayuda="Por ejemplo: jornal agrícola, comercio informal."
          requerido
          defaultValue={valores.fuenteIngreso}
          error={e.fuenteIngreso}
        />
        <CampoTexto
          id="escolaridadEncargado"
          name="escolaridadEncargado"
          etiqueta="Escolaridad del encargado"
          requerido
          defaultValue={valores.escolaridadEncargado}
          error={e.escolaridadEncargado}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Vivienda
        </legend>
        <CampoTexto
          id="tipoVivienda"
          name="tipoVivienda"
          etiqueta="Tipo de vivienda"
          ayuda="Propia, alquilada, prestada…"
          requerido
          defaultValue={valores.tipoVivienda}
          error={e.tipoVivienda}
        />
        <CampoTexto
          id="materialConstruccion"
          name="materialConstruccion"
          etiqueta="Material de construcción"
          requerido
          defaultValue={valores.materialConstruccion}
          error={e.materialConstruccion}
        />
        <CampoTexto
          id="serviciosBasicos"
          name="serviciosBasicos"
          etiqueta="Servicios básicos"
          ayuda="Sepáralos con comas. Por ejemplo: Agua, Luz, Drenaje."
          defaultValue={valores.serviciosBasicos}
          error={e.serviciosBasicos}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Valoración y firma
        </legend>
        <CampoSelect
          id="nivelVulnerabilidad"
          name="nivelVulnerabilidad"
          etiqueta="Nivel de vulnerabilidad"
          requerido
          defaultValue={valores.nivelVulnerabilidad}
          error={e.nivelVulnerabilidad}
        >
          <option value="ALTO">Alto</option>
          <option value="MEDIO">Medio</option>
          <option value="BAJO">Bajo</option>
        </CampoSelect>
        <CampoTexto
          id="fechaEstudio"
          name="fechaEstudio"
          type="date"
          etiqueta="Fecha del estudio"
          requerido
          defaultValue={valores.fechaEstudio}
          error={e.fechaEstudio}
        />
        <CampoTexto
          id="realizadoPor"
          name="realizadoPor"
          etiqueta="Realizado por"
          requerido
          defaultValue={valores.realizadoPor}
          error={e.realizadoPor}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <CampoArea
            id="observaciones"
            name="observaciones"
            etiqueta="Observaciones"
            rows={4}
            defaultValue={valores.observaciones}
            error={e.observaciones}
          />
        </div>
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4 sm:col-span-2 lg:col-span-3">
          <input
            id="elegibleBeca"
            name="elegibleBeca"
            type="checkbox"
            defaultChecked={valores.elegibleBeca}
            className="mt-1 size-4 rounded border-line"
          />
          <label htmlFor="elegibleBeca" className="medida-lectura text-sm text-ink">
            <span className="font-semibold">Elegible para beca.</span> El
            estudio respalda que la familia no puede cubrir la cuota.
          </label>
        </div>
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar ficha socioeconómica"}
        </Boton>
      </div>
    </form>
  );
}
