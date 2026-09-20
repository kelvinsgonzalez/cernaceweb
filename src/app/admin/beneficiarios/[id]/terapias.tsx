"use client";

import { useActionState } from "react";
import { Boton, CampoArea, CampoTexto, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

/**
 * Una terapia del expediente: el nombre y, si hace falta, la explicación
 * larga. El mismo formulario sirve para añadir y para corregir; lo que cambia
 * es si lleva `terapiaId`.
 */
export function FormularioTerapia({
  accion,
  beneficiarioId,
  terapiaId,
  valores,
}: {
  accion: Accion;
  beneficiarioId: string;
  terapiaId?: string;
  valores?: { nombre: string; detalle: string };
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const sufijo = terapiaId ? `-${terapiaId}` : "-nueva";
  const corrige = Boolean(terapiaId);

  return (
    <form
      action={enviar}
      className="flex flex-col gap-4"
      noValidate
      // Al añadir, el formulario se vacía en cuanto la acción responde bien.
      key={corrige ? terapiaId : estado.ok}
    >
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
      {terapiaId ? (
        <input type="hidden" name="terapiaId" value={terapiaId} />
      ) : null}

      <CampoTexto
        id={`nombre${sufijo}`}
        name="nombre"
        etiqueta="Terapia"
        ayuda={
          corrige
            ? undefined
            : "Por ejemplo: Terapia física, Terapia del lenguaje, Hidroterapia."
        }
        requerido
        maxLength={80}
        defaultValue={valores?.nombre ?? ""}
        error={e.nombre}
        autoComplete="off"
      />

      <CampoArea
        id={`detalle${sufijo}`}
        name="detalle"
        etiqueta="Explicación"
        ayuda="Opcional. En qué consiste para este niño, con qué frecuencia, qué se trabaja."
        rows={corrige ? 3 : 4}
        maxLength={2000}
        defaultValue={valores?.detalle ?? ""}
        error={e.detalle}
      />

      <div>
        <Boton
          type="submit"
          variante={corrige ? "contorno" : "solido"}
          disabled={pendiente}
          className={corrige ? undefined : "px-6 py-3"}
        >
          {pendiente
            ? "Guardando…"
            : corrige
              ? "Guardar cambios"
              : "Añadir terapia"}
        </Boton>
      </div>
    </form>
  );
}
