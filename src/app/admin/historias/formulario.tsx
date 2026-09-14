"use client";

import { useActionState } from "react";
import Image from "next/image";
import {
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { MAXIMO_RESUMEN } from "@/lib/historias";

const claseArchivo =
  "w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark";

export type ValoresHistoria = {
  id: string;
  titulo: string;
  protagonista: string;
  programa: string;
  resumen: string;
  contenido: string;
  imagenAlt: string;
  estado: string;
  /** La foto que ya tiene, para verla mientras se edita. */
  imagen: string | null;
  imagenDescripcion: string;
};

/**
 * El mismo formulario abre una casilla vacía y corrige la historia que ya está
 * en ella. Cambia el botón y, cuando hay foto, la vista previa y la casilla
 * para quitarla.
 *
 * La posición no se elige aquí: es la casilla desde la que se abrió el
 * formulario, y viaja en un campo oculto.
 *
 * Los seis formularios de la página conviven en el mismo documento aunque solo
 * uno esté desplegado, así que cada control lleva la posición en su `id`: dos
 * `id` repetidos dejarían la mitad de las etiquetas apuntando al control
 * equivocado.
 */
export function FormularioHistoria({
  accion,
  posicion,
  valores,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  /** La casilla a la que pertenece. No se elige: es la fila donde se abrió. */
  posicion: number;
  valores?: ValoresHistoria;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const edicion = Boolean(valores);
  const campo = (nombre: string) => `${nombre}-casilla-${posicion}`;

  const idImagen = campo("imagen");
  const idAyudaImagen = `${idImagen}-ayuda`;
  const idErrorImagen = `${idImagen}-error`;

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      {valores ? <input type="hidden" name="id" value={valores.id} /> : null}
      {/* La posición no se teclea: es la casilla desde la que se abrió esto. */}
      <input type="hidden" name="orden" value={posicion} />

      <CampoTexto
        id={campo("titulo")}
        name="titulo"
        etiqueta="Título"
        ayuda="La frase que encabeza la tarjeta. Por ejemplo: «Diego dio sus primeros cuarenta metros»."
        requerido
        maxLength={120}
        defaultValue={valores?.titulo ?? ""}
        error={e.titulo}
        autoComplete="off"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id={campo("protagonista")}
          name="protagonista"
          etiqueta="Nombre del beneficiado"
          ayuda="Solo el primer nombre: la historia es pública y el apellido no se publica."
          requerido
          maxLength={60}
          defaultValue={valores?.protagonista ?? ""}
          error={e.protagonista}
          autoComplete="off"
        />
        <CampoTexto
          id={campo("programa")}
          name="programa"
          etiqueta="Programa"
          ayuda="El área que acompañó el avance. Opcional."
          maxLength={80}
          defaultValue={valores?.programa ?? ""}
          error={e.programa}
          autoComplete="off"
        />
      </div>

      <CampoArea
        id={campo("resumen")}
        name="resumen"
        etiqueta="Historia breve"
        ayuda={`Lo que se lee debajo de la foto, en la página de inicio. Dos o tres líneas, ${MAXIMO_RESUMEN} caracteres como máximo.`}
        requerido
        rows={3}
        maxLength={MAXIMO_RESUMEN}
        defaultValue={valores?.resumen ?? ""}
        error={e.resumen}
      />

      <CampoArea
        id={campo("contenido")}
        name="contenido"
        etiqueta="Relato completo"
        ayuda="Opcional, para el archivo del centro. En la portada se lee la historia breve; si lo dejas vacío, se guarda esa."
        rows={5}
        defaultValue={valores?.contenido ?? ""}
        error={e.contenido}
      />

      {valores?.imagen ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">Fotografía actual</p>
          <Image
            src={valores.imagen}
            alt={valores.imagenDescripcion}
            width={320}
            height={240}
            unoptimized
            className="aspect-[4/3] w-full max-w-xs rounded-[var(--radius-sm)] border border-line bg-canvas object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idImagen} className="text-sm font-semibold text-ink">
          {valores?.imagen ? "Reemplazar la fotografía" : "Fotografía"}
          {!edicion ? (
            <>
              <span className="ml-1 text-danger" aria-hidden="true">
                *
              </span>
              <span className="visually-hidden">
                (obligatorio para que se vea en la portada)
              </span>
            </>
          ) : null}
        </label>
        <p id={idAyudaImagen} className="medida-lectura text-xs text-ink-soft">
          JPG, PNG o WebP de 5 MB como máximo. Se recorta a 4:3 en la tarjeta,
          así que conviene que el protagonista quede al centro. Para salir en la
          portada hace falta la foto; oculta puede esperar a tenerla.
        </p>
        <input
          id={idImagen}
          name="imagen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={
            e.imagen ? `${idAyudaImagen} ${idErrorImagen}` : idAyudaImagen
          }
          aria-invalid={e.imagen ? true : undefined}
          className={claseArchivo}
        />
        {e.imagen ? (
          <p
            id={idErrorImagen}
            role="alert"
            className="text-xs font-medium text-danger"
          >
            {e.imagen}
          </p>
        ) : null}
      </div>

      {valores?.imagen ? (
        <div className="flex items-start gap-3">
          <input
            id={campo("quitarImagen")}
            name="quitarImagen"
            type="checkbox"
            className="mt-1 size-4 rounded border-line"
          />
          <label
            htmlFor={campo("quitarImagen")}
            className="medida-lectura text-sm text-ink"
          >
            Quitar la fotografía actual. Sin foto la historia no puede salir en
            la portada: déjala oculta en este mismo guardado. Si eliges un
            archivo nuevo arriba, esta casilla se ignora.
          </label>
        </div>
      ) : null}

      <CampoTexto
        id={campo("imagenAlt")}
        name="imagenAlt"
        etiqueta="Descripción de la fotografía"
        ayuda="Qué se ve en la foto, para quien navega con lector de pantalla. Si lo dejas vacío se usa «Fotografía de» y el nombre."
        maxLength={160}
        defaultValue={valores?.imagenAlt ?? ""}
        error={e.imagenAlt}
        autoComplete="off"
      />

      <CampoSelect
        id={campo("estado")}
        name="estado"
        etiqueta="¿Se ve en la portada?"
        ayuda={`Visible sale en la casilla ${posicion} de la portada y en la página de donaciones. Oculta se queda guardada en la casilla, sin salir en el sitio.`}
        requerido
        defaultValue={valores?.estado ?? "PUBLICADO"}
        error={e.estado}
        className="sm:max-w-sm"
      >
        <option value="PUBLICADO">Visible en la portada</option>
        <option value="BORRADOR">Oculta, guardada en la casilla</option>
      </CampoSelect>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? "Guardando…"
            : edicion
              ? "Guardar cambios"
              : `Guardar la historia en la casilla ${posicion}`}
        </Boton>
      </div>
    </form>
  );
}
