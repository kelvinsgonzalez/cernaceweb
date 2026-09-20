"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresClinico = {
  diagnosticoPrincipal: string;
  codigoCie10: string;
  fechaDiagnostico: string;
  tipoDiscapacidad: string;
  gradoDependencia: string;
  medicoTratante: string;
  alergias: string;
  medicamentos: string;
  antecedentes: string;
};

const claseGrupo = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

export function FormularioClinico({
  accion,
  beneficiarioId,
  valores,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  valores: ValoresClinico;
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

      <fieldset className={claseGrupo}>
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Diagnóstico
        </legend>
        <CampoTexto
          id="diagnosticoPrincipal"
          name="diagnosticoPrincipal"
          etiqueta="Diagnóstico principal"
          requerido
          defaultValue={valores.diagnosticoPrincipal}
          error={e.diagnosticoPrincipal}
          className="lg:col-span-2"
        />
        <CampoTexto
          id="codigoCie10"
          name="codigoCie10"
          etiqueta="Código CIE-10"
          defaultValue={valores.codigoCie10}
          error={e.codigoCie10}
        />
        <CampoTexto
          id="fechaDiagnostico"
          name="fechaDiagnostico"
          type="date"
          etiqueta="Fecha del diagnóstico"
          defaultValue={valores.fechaDiagnostico}
          error={e.fechaDiagnostico}
        />
        <CampoTexto
          id="tipoDiscapacidad"
          name="tipoDiscapacidad"
          etiqueta="Tipo de discapacidad"
          requerido
          defaultValue={valores.tipoDiscapacidad}
          error={e.tipoDiscapacidad}
        />
        <CampoTexto
          id="gradoDependencia"
          name="gradoDependencia"
          etiqueta="Grado de dependencia"
          requerido
          defaultValue={valores.gradoDependencia}
          error={e.gradoDependencia}
        />
      </fieldset>

      <fieldset className={claseGrupo}>
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Atención médica
        </legend>
        <CampoTexto
          id="medicoTratante"
          name="medicoTratante"
          etiqueta="Médico tratante"
          defaultValue={valores.medicoTratante}
          error={e.medicoTratante}
        />
        <CampoTexto
          id="alergias"
          name="alergias"
          etiqueta="Alergias"
          defaultValue={valores.alergias}
          error={e.alergias}
        />
        <CampoTexto
          id="medicamentos"
          name="medicamentos"
          etiqueta="Medicamentos"
          defaultValue={valores.medicamentos}
          error={e.medicamentos}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <CampoArea
            id="antecedentes"
            name="antecedentes"
            etiqueta="Antecedentes"
            rows={4}
            defaultValue={valores.antecedentes}
            error={e.antecedentes}
          />
        </div>
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar expediente clínico"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioEvaluacion({
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
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="fecha"
          name="fecha"
          type="date"
          etiqueta="Fecha"
          requerido
          defaultValue={hoy}
          error={e.fecha}
        />
        <CampoTexto
          id="tipo"
          name="tipo"
          etiqueta="Tipo de evaluación"
          ayuda="Por ejemplo: Neurológica, Psicológica, Audiológica."
          requerido
          error={e.tipo}
        />
        <CampoTexto
          id="profesional"
          name="profesional"
          etiqueta="Profesional que la realizó"
          requerido
          error={e.profesional}
        />
        <CampoTexto
          id="documento"
          name="documento"
          etiqueta="Documento de respaldo"
          ayuda="Referencia del informe en papel, si lo hay."
          error={e.documento}
        />
      </div>

      <CampoArea
        id="resultado"
        name="resultado"
        etiqueta="Resultado"
        rows={3}
        requerido
        error={e.resultado}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Registrar evaluación"}
        </Boton>
      </div>
    </form>
  );
}
