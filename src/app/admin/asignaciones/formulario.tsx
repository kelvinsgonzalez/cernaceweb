"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type OpcionPadrino = { id: string; etiqueta: string };
export type OpcionBeneficiario = { id: string; etiqueta: string };

export function FormularioAsignacion({
  accion,
  padrinos,
  beneficiarios,
  aporteSugerido,
  hoy,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  padrinos: OpcionPadrino[];
  beneficiarios: OpcionBeneficiario[];
  aporteSugerido: string;
  hoy: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const sinCandidatos = padrinos.length === 0 || beneficiarios.length === 0;

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoSelect
          id="beneficiarioId"
          name="beneficiarioId"
          etiqueta="Beneficiario sin padrino"
          requerido
          error={e.beneficiarioId}
          defaultValue=""
        >
          <option value="" disabled>
            {beneficiarios.length === 0
              ? "No hay beneficiarios disponibles"
              : "Selecciona un beneficiario"}
          </option>
          {beneficiarios.map((b) => (
            <option key={b.id} value={b.id}>
              {b.etiqueta}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect
          id="padrinoId"
          name="padrinoId"
          etiqueta="Cuenta de padrino"
          requerido
          error={e.padrinoId}
          defaultValue=""
        >
          <option value="" disabled>
            {padrinos.length === 0
              ? "No hay padrinos registrados"
              : "Selecciona un padrino"}
          </option>
          {padrinos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}
            </option>
          ))}
        </CampoSelect>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <CampoTexto
          id="aporteMensual"
          name="aporteMensual"
          type="number"
          min={50}
          step={25}
          etiqueta="Aporte mensual de referencia (Q)"
          ayuda="No es una cuota: solo alimenta la barra de ánimo del niño."
          requerido
          defaultValue={aporteSugerido}
          error={e.aporteMensual}
        />
        <CampoTexto
          id="fechaInicio"
          name="fechaInicio"
          type="date"
          etiqueta="Inicia el"
          requerido
          defaultValue={hoy}
          error={e.fechaInicio}
        />
        <CampoTexto
          id="caducaEl"
          name="caducaEl"
          type="date"
          etiqueta="Caduca el (opcional)"
          ayuda="Al llegar, aparece aquí para que decidas; nada pasa solo."
          error={e.caducaEl}
        />
      </div>

      <div>
        <Boton
          type="submit"
          disabled={pendiente || sinCandidatos}
          className="px-6 py-3"
        >
          {pendiente ? "Asignando…" : "Asignar padrinazgo"}
        </Boton>
      </div>
    </form>
  );
}
