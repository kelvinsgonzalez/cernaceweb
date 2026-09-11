"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

/** Las que ya se usan en el expediente, para no inventar categorías nuevas. */
export const CATEGORIAS_DOCUMENTO = [
  "Identificación",
  "Clínico",
  "Educativo",
  "Socioeconómico",
  "Autorizaciones",
  "Informes de terapia",
  "Otros",
];

export type ValoresDocumento = {
  nombre: string;
  categoria: string;
  fechaVencimiento: string;
  visibleParaPadrino: boolean;
};

const SIN_VALORES: ValoresDocumento = {
  nombre: "",
  categoria: "",
  fechaVencimiento: "",
  visibleParaPadrino: false,
};

/**
 * Adjuntar un documento y corregir su ficha son el mismo formulario. Al
 * corregir no se pide el archivo: cambiarlo sería otro documento, y para eso
 * está adjuntar uno nuevo y borrar el viejo.
 */
export function FormularioDocumento({
  accion,
  beneficiarioId,
  documentoId,
  categorias,
  tamanoMaximoMb,
  valores = SIN_VALORES,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  /** Presente al corregir una ficha ya guardada. */
  documentoId?: string;
  categorias: string[];
  tamanoMaximoMb: number;
  valores?: ValoresDocumento;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const corrigiendo = Boolean(documentoId);

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
      {documentoId ? (
        <input type="hidden" name="documentoId" value={documentoId} />
      ) : null}

      <div className={corrigiendo ? "hidden" : "flex flex-col gap-1.5"}>
        <label htmlFor="archivo" className="text-sm font-semibold text-ink">
          Archivo
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
          <span className="visually-hidden">(obligatorio)</span>
        </label>
        <p id="archivo-ayuda" className="medida-lectura text-xs text-ink-soft">
          PDF o imagen JPG, PNG o WebP, de {tamanoMaximoMb} MB como máximo. Se
          guarda fuera de cualquier carpeta pública y se entrega por una ruta que
          comprueba el permiso en cada descarga.
        </p>
        <input
          id="archivo"
          name="archivo"
          type="file"
          required={!corrigiendo}
          disabled={corrigiendo}
          accept="application/pdf,image/jpeg,image/png,image/webp"
          aria-describedby={
            e.archivo ? "archivo-ayuda archivo-error" : "archivo-ayuda"
          }
          aria-invalid={e.archivo ? true : undefined}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {e.archivo ? (
          <p
            id="archivo-error"
            role="alert"
            className="text-xs font-medium text-danger"
          >
            {e.archivo}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="Nombre del documento"
          ayuda="Como debe aparecer en el expediente."
          requerido
          defaultValue={valores.nombre}
          error={e.nombre}
        />
        <CampoSelect
          id="categoria"
          name="categoria"
          etiqueta="Categoría"
          requerido
          defaultValue={valores.categoria}
          error={e.categoria}
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </CampoSelect>
      </div>

      <CampoTexto
        id="fechaVencimiento"
        name="fechaVencimiento"
        type="date"
        etiqueta="Vence el"
        ayuda="Solo si el documento caduca, como una constancia o un carné."
        defaultValue={valores.fechaVencimiento}
        error={e.fechaVencimiento}
        className="max-w-xs"
      />

      <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <input
          id="visibleParaPadrino"
          name="visibleParaPadrino"
          type="checkbox"
          defaultChecked={valores.visibleParaPadrino}
          className="mt-1 size-4 rounded border-line"
        />
        <label
          htmlFor="visibleParaPadrino"
          className="medida-lectura text-sm text-ink"
        >
          <span className="font-semibold">Compartir con el padrino.</span> Si lo
          marcas, el padrino podrá abrirlo desde su portal. Déjalo sin marcar
          para los documentos internos: expedientes clínicos, estudios del hogar
          o cualquier papel con datos de la familia.
        </label>
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? corrigiendo
              ? "Guardando…"
              : "Subiendo…"
            : corrigiendo
              ? "Guardar los cambios"
              : "Adjuntar al expediente"}
        </Boton>
      </div>
    </form>
  );
}
