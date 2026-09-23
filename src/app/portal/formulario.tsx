"use client";

import { useActionState } from "react";
import { Boton, CampoArea, MensajeFormulario } from "@/components/ui";
import { CampoBoleta } from "@/components/formularios-publicos";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

/**
 * Lo único que el padrino aporta: la foto del comprobante y, si quiere, unas
 * palabras para el niño. Ni monto ni mes: eso lo anota el administrador.
 */
export function FormularioAportePadrino({
  accion,
  beneficiarioId,
  nombre,
  tamanoMaximoMb,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  nombre: string;
  tamanoMaximoMb: number;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      <CampoBoleta error={e.boleta} tamanoMaximoMb={tamanoMaximoMb} />

      <CampoArea
        id="mensaje"
        name="mensaje"
        etiqueta={`Un mensaje de amor para ${nombre} (opcional)`}
        ayuda="Unas palabras de ánimo. El equipo las revisa y, al aprobar tu aporte, se las hace llegar a la familia."
        rows={3}
        maxLength={500}
        error={e.mensaje}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Enviando…" : "Enviar mi aporte"}
        </Boton>
      </div>
    </form>
  );
}
