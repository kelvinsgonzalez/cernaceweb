"use client";

import { useActionState } from "react";
import { Boton, CampoArea, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export function FormularioPublicacion({
  accion,
  id,
  resumenPublico,
  publicado,
  tieneFoto,
  puedePublicar,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  id: string;
  resumenPublico: string;
  publicado: boolean;
  tieneFoto: boolean;
  puedePublicar: boolean;
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

      <input type="hidden" name="id" value={id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="foto" className="text-sm font-semibold text-ink">
          Foto del beneficiario
        </label>
        <p id="foto-ayuda" className="medida-lectura text-xs text-ink-soft">
          JPG, PNG o WebP de 5 MB como máximo. No se guarda en una carpeta
          pública: se sirve por una ruta que comprueba la autorización, así que
          al retirarla la foto deja de ser accesible.
        </p>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={e.foto ? "foto-ayuda foto-error" : "foto-ayuda"}
          aria-invalid={e.foto ? true : undefined}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {e.foto ? (
          <p id="foto-error" role="alert" className="text-xs font-medium text-danger">
            {e.foto}
          </p>
        ) : null}
      </div>

      {tieneFoto ? (
        <div className="flex items-start gap-3">
          <input
            id="quitarFoto"
            name="quitarFoto"
            type="checkbox"
            className="mt-1 size-4 rounded border-line"
          />
          <label htmlFor="quitarFoto" className="medida-lectura text-sm text-ink">
            Quitar la foto actual y dejar la tarjeta con la inicial. Si eliges un
            archivo nuevo arriba, esta casilla se ignora.
          </label>
        </div>
      ) : null}

      <CampoArea
        id="resumenPublico"
        name="resumenPublico"
        etiqueta="Resumen público"
        ayuda="Texto breve que acompaña a la foto. Nada identificable ni clínico: ni apellidos, ni diagnóstico, ni datos de la familia."
        rows={4}
        defaultValue={resumenPublico}
        error={e.resumenPublico}
      />

      <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <input
          id="publicadoEnGaleria"
          name="publicadoEnGaleria"
          type="checkbox"
          defaultChecked={publicado}
          disabled={!puedePublicar}
          className="mt-1 size-4 rounded border-line"
        />
        <label
          htmlFor="publicadoEnGaleria"
          className="medida-lectura text-sm text-ink"
        >
          <span className="font-semibold">
            Autorizo que sus datos generales y su foto salgan en la página
            pública.
          </span>{" "}
          Se muestran el primer nombre, la edad, el programa y este resumen.
          Nunca apellidos, diagnóstico ni datos de la familia. Deja de aparecer
          en cuanto se le asigne un padrino.
          {puedePublicar ? null : (
            <span className="mt-2 block font-semibold text-danger">
              No se puede autorizar: la familia no ha pedido patrocinador en la
              ficha de inscripción.
            </span>
          )}
        </label>
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar"}
        </Boton>
      </div>
    </form>
  );
}
