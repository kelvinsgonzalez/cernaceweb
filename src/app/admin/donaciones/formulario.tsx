"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type OpcionDestino = { valor: string; etiqueta: string; grupo: string };
export type OpcionMetodo = { valor: string; etiqueta: string };

/**
 * Registrar un aporte a mano. El destino es un apadrinamiento vigente
 * (padrino → niño) o una campaña; el mes es el de hoy y el aporte nace
 * aprobado, así que aquí no se pregunta ni fecha ni estado.
 */
export function FormularioAporteManual({
  accion,
  destinos,
  metodos,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  destinos: OpcionDestino[];
  metodos: OpcionMetodo[];
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const grupos = [...new Set(destinos.map((d) => d.grupo))];

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <CampoSelect
        id="destino"
        name="destino"
        etiqueta="A qué va el aporte"
        requerido
        defaultValue=""
        error={e.destino}
      >
        <option value="" disabled>
          Elige un apadrinamiento o una campaña
        </option>
        {grupos.map((grupo) => (
          <optgroup key={grupo} label={grupo}>
            {destinos
              .filter((d) => d.grupo === grupo)
              .map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.etiqueta}
                </option>
              ))}
          </optgroup>
        ))}
      </CampoSelect>

      <div className="grid gap-5 sm:grid-cols-3">
        <CampoTexto
          id="monto"
          name="monto"
          type="number"
          min={1}
          step="0.01"
          etiqueta="Monto (quetzales)"
          requerido
          error={e.monto}
        />
        <CampoSelect
          id="metodo"
          name="metodo"
          etiqueta="Método"
          requerido
          defaultValue="EFECTIVO"
          error={e.metodo}
        >
          {metodos.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          id="nota"
          name="nota"
          etiqueta="Nota o de parte de"
          ayuda="Opcional. Quién lo entregó o cualquier detalle."
          maxLength={300}
          error={e.nota}
          autoComplete="off"
        />
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Registrando…" : "Registrar aporte"}
        </Boton>
      </div>
    </form>
  );
}
