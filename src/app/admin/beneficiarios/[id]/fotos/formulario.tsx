"use client";

import { useActionState } from "react";
import { Boton, CampoArea, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

const claseArchivo =
  "w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark";

/** Foto principal: una sola, la que identifica el expediente y la que sale en
 *  el sitio cuando se le busca padrino. */
export function FormularioFotoPrincipal({
  accion,
  id,
  tieneFoto,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  id: string;
  tieneFoto: boolean;
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

      <input type="hidden" name="id" value={id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="foto" className="text-sm font-semibold text-ink">
          {tieneFoto ? "Reemplazar la foto" : "Subir la foto"}
        </label>
        <p id="foto-ayuda" className="medida-lectura text-xs text-ink-soft">
          JPG, PNG o WebP de 5 MB como máximo. No se guarda en una carpeta
          pública: se sirve por una ruta que comprueba en cada petición quién
          pregunta y si el niño está publicado.
        </p>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={e.foto ? "foto-ayuda foto-error" : "foto-ayuda"}
          aria-invalid={e.foto ? true : undefined}
          className={claseArchivo}
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

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar foto principal"}
        </Boton>
      </div>
    </form>
  );
}

/** Fotos de evidencia: cuantas haga falta, con un pie común a la tanda. */
export function FormularioFotosEvidencia({
  accion,
  beneficiarioId,
  maximo,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  maximo: number;
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fotos" className="text-sm font-semibold text-ink">
          Fotografías
        </label>
        <p id="fotos-ayuda" className="medida-lectura text-xs text-ink-soft">
          Hasta {maximo} por tanda, JPG, PNG o WebP de 5 MB cada una. Puedes
          elegir varias a la vez.
        </p>
        <input
          id="fotos"
          name="fotos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={e.fotos ? "fotos-ayuda fotos-error" : "fotos-ayuda"}
          aria-invalid={e.fotos ? true : undefined}
          className={claseArchivo}
        />
        {e.fotos ? (
          <p id="fotos-error" role="alert" className="text-xs font-medium text-danger">
            {e.fotos}
          </p>
        ) : null}
      </div>

      <CampoArea
        id="descripcion"
        name="descripcion"
        etiqueta="Pie de foto"
        ayuda="Qué muestran y de cuándo son. Se aplica a todas las de esta tanda."
        rows={2}
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
          <span className="font-semibold">Compartir con el padrino y la familia.</span>{" "}
          Sin marcar, estas fotos son solo para el equipo: nadie fuera del
          personal puede abrirlas.
        </label>
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Subiendo…" : "Adjuntar fotografías"}
        </Boton>
      </div>
    </form>
  );
}
