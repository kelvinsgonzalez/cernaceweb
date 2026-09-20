"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoTexto,
  Chip,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

export type OpcionResponsable = {
  id: string;
  nombre: string;
  cargo: string | null;
  curriculum: string | null;
  roles: string;
  casos: number;
};

export function FormularioPlan({
  accion,
  beneficiarioId,
  hoy,
  valores,
}: {
  accion: Accion;
  beneficiarioId: string;
  hoy: string;
  valores: {
    objetivoGeneral: string;
    anotaciones: string;
    fechaAprobacion: string;
    activo: boolean;
    existe: boolean;
  };
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

      <CampoArea
        id="objetivoGeneral"
        name="objetivoGeneral"
        etiqueta="Objetivo general del tratamiento"
        ayuda="Lo que se persigue con este niño. Lo lee todo el equipo asignado."
        rows={4}
        requerido
        defaultValue={valores.objetivoGeneral}
        error={e.objetivoGeneral}
      />

      <CampoArea
        id="anotaciones"
        name="anotaciones"
        etiqueta="Anotaciones para el equipo"
        ayuda="Indicaciones, precauciones o acuerdos con la familia. Las ven todos los responsables."
        rows={4}
        defaultValue={valores.anotaciones}
        error={e.anotaciones}
      />

      <CampoTexto
        id="fechaAprobacion"
        name="fechaAprobacion"
        type="date"
        etiqueta="Fecha de aprobación"
        requerido
        defaultValue={valores.fechaAprobacion || hoy}
        error={e.fechaAprobacion}
        className="max-w-xs"
      />

      <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <input
          id="activo"
          name="activo"
          type="checkbox"
          defaultChecked={valores.existe ? valores.activo : true}
          className="mt-1 size-4 rounded border-line"
        />
        <label htmlFor="activo" className="medida-lectura text-sm text-ink">
          <span className="font-semibold">Aprobado para recibir terapia.</span>{" "}
          Mientras esta casilla esté marcada, el equipo asignado puede registrar
          avances. Si la desmarcas, el plan queda suspendido y nadie puede
          registrarlos.
        </label>
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? "Guardando…"
            : valores.existe
              ? "Guardar el plan"
              : "Aprobar y guardar el plan"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioResponsables({
  accion,
  beneficiarioId,
  candidatos,
  asignados,
}: {
  accion: Accion;
  beneficiarioId: string;
  candidatos: OpcionResponsable[];
  asignados: string[];
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

      <fieldset
        aria-describedby={e.responsables ? "responsables-error" : undefined}
        className="flex flex-col gap-3"
      >
        <legend className="text-sm font-semibold text-ink">
          Quién atenderá a este niño
        </legend>
        <p className="medida-lectura text-xs text-ink-soft">
          Marca una, varias o todas las cuentas. Solo aparecen las que pueden
          registrar avances. Lo que dejes marcado es el equipo: al desmarcar a
          alguien se le da de baja con la fecha de hoy, sin borrar los avances
          que ya escribió.
        </p>

        {candidatos.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No hay cuentas que puedan registrar avances.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {candidatos.map((c) => (
              <li key={c.id}>
                <label
                  htmlFor={`responsable-${c.id}`}
                  className="flex h-full items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4 hover:border-brand-primary"
                >
                  <input
                    id={`responsable-${c.id}`}
                    name="responsables"
                    type="checkbox"
                    value={c.id}
                    defaultChecked={asignados.includes(c.id)}
                    className="mt-1 size-4 shrink-0 rounded border-line"
                  />
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {c.nombre}
                      </span>
                      <Chip tono="neutro">
                        {c.casos} {c.casos === 1 ? "caso" : "casos"}
                      </Chip>
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">
                      {c.cargo ?? c.roles}
                    </span>
                    {c.curriculum ? (
                      <span className="medida-lectura mt-2 block text-xs text-ink-soft">
                        {c.curriculum}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {e.responsables ? (
          <p
            id="responsables-error"
            role="alert"
            className="text-xs font-medium text-danger"
          >
            {e.responsables}
          </p>
        ) : null}
      </fieldset>

      <div>
        <Boton
          type="submit"
          disabled={pendiente || candidatos.length === 0}
          className="px-6 py-3"
        >
          {pendiente ? "Guardando…" : "Guardar el equipo"}
        </Boton>
      </div>
    </form>
  );
}
