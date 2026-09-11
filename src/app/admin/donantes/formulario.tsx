"use client";

import { useActionState } from "react";
import { Boton, CampoTexto, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

export type ValoresPadrino = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ocupacion: string;
  nit: string;
};

/**
 * El mismo formulario sirve para el alta y para la corrección: cambia el botón
 * y, si viene una ficha, el id oculto. El correo se bloquea cuando ya hay
 * cuenta enlazada porque es con el que la persona entra al portal.
 */
export function FormularioPadrino({
  accion,
  valores,
  correoBloqueado = false,
}: {
  accion: Accion;
  valores?: ValoresPadrino;
  correoBloqueado?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const edicion = Boolean(valores);

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      {valores ? <input type="hidden" name="id" value={valores.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="Nombre o razón social"
          ayuda="El de la persona u organización que aporta."
          requerido
          defaultValue={valores?.nombre ?? ""}
          error={e.nombre}
          autoComplete="off"
        />
        <CampoTexto
          id="email"
          name="email"
          type="email"
          etiqueta="Correo"
          ayuda={
            correoBloqueado
              ? "No se puede cambiar: es con el que entra al portal."
              : "Identifica la ficha y será su usuario si le das acceso al portal."
          }
          requerido
          readOnly={correoBloqueado}
          defaultValue={valores?.email ?? ""}
          error={e.email}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="telefono"
          name="telefono"
          type="tel"
          etiqueta="Teléfono"
          defaultValue={valores?.telefono ?? ""}
          error={e.telefono}
          autoComplete="off"
        />
        <CampoTexto
          id="ocupacion"
          name="ocupacion"
          etiqueta="Ocupación"
          ayuda="Por ejemplo: Comerciante, Empresa de transporte."
          defaultValue={valores?.ocupacion ?? ""}
          error={e.ocupacion}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="direccion"
          name="direccion"
          etiqueta="Dirección"
          defaultValue={valores?.direccion ?? ""}
          error={e.direccion}
          autoComplete="off"
        />
        <CampoTexto
          id="nit"
          name="nit"
          etiqueta="NIT"
          ayuda="Para el recibo de la donación."
          defaultValue={valores?.nit ?? ""}
          error={e.nit}
          autoComplete="off"
        />
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? "Guardando…"
            : edicion
              ? "Guardar cambios"
              : "Registrar padrino"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioAccesoPadrino({
  accion,
  padrinoId,
  email,
}: {
  accion: Accion;
  padrinoId: string;
  email: string;
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

      <input type="hidden" name="padrinoId" value={padrinoId} />

      <p className="medida-lectura text-sm text-ink-soft">
        Entrará con <span className="font-semibold text-ink">{email}</span>, el
        correo de la ficha. La plataforma no envía correos: la contraseña se la
        tienes que comunicar tú por un medio seguro.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="password"
          name="password"
          type="password"
          etiqueta="Contraseña inicial"
          ayuda="Mínimo 8 caracteres."
          requerido
          minLength={8}
          error={e.password}
          autoComplete="new-password"
        />
        <CampoTexto
          id="passwordConfirmacion"
          name="passwordConfirmacion"
          type="password"
          etiqueta="Repite la contraseña"
          requerido
          minLength={8}
          error={e.passwordConfirmacion}
          autoComplete="new-password"
        />
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Creando…" : "Crear el acceso"}
        </Boton>
      </div>
    </form>
  );
}

export function BotonEstadoPadrino({
  accion,
  id,
  activo,
}: {
  accion: Accion;
  id: string;
  activo: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  return (
    <form action={enviar} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="activar" value={activo ? "no" : "si"} />
      <Boton type="submit" variante="contorno" disabled={pendiente}>
        {pendiente ? "Guardando…" : activo ? "Dar de baja" : "Reactivar"}
      </Boton>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}
      {estado.ok ? (
        <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>
      ) : null}
    </form>
  );
}
