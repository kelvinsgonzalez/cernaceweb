"use client";

import { useActionState } from "react";
import { Boton, CampoTexto, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

export function FormularioNuevoTerapeuta({ accion }: { accion: Accion }) {
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

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="Nombre completo"
          requerido
          error={e.nombre}
          autoComplete="off"
        />
        <CampoTexto
          id="email"
          name="email"
          type="email"
          etiqueta="Correo"
          ayuda="Con este correo iniciará sesión."
          requerido
          error={e.email}
          autoComplete="off"
        />
      </div>

      <CampoTexto
        id="cargo"
        name="cargo"
        etiqueta="Especialidad o cargo"
        ayuda="Por ejemplo: Terapeuta del lenguaje, Fisioterapista."
        error={e.cargo}
        autoComplete="off"
      />

      <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
        <legend className="text-sm font-semibold text-ink">
          Contraseña inicial
        </legend>
        <p className="medida-lectura text-xs text-ink-soft">
          La plataforma no envía correos, así que tendrás que comunicársela por
          un medio seguro y pedirle que la cambie.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id="password"
            name="password"
            type="password"
            etiqueta="Contraseña"
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
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Creando…" : "Dar de alta al terapeuta"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioEditarTerapeuta({
  accion,
  id,
  nombre,
  cargo,
}: {
  accion: Accion;
  id: string;
  nombre: string;
  cargo: string | null;
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

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="Nombre completo"
          requerido
          defaultValue={nombre}
          error={e.nombre}
        />
        <CampoTexto
          id="cargo"
          name="cargo"
          etiqueta="Especialidad o cargo"
          defaultValue={cargo ?? ""}
          error={e.cargo}
        />
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioContrasenaTerapeuta({
  accion,
  id,
}: {
  accion: Accion;
  id: string;
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

      <CampoTexto
        id="password-nueva"
        name="password"
        type="password"
        etiqueta="Contraseña nueva"
        ayuda="Mínimo 8 caracteres."
        requerido
        minLength={8}
        error={e.password}
        autoComplete="new-password"
      />
      <CampoTexto
        id="password-confirmacion"
        name="passwordConfirmacion"
        type="password"
        etiqueta="Repite la contraseña"
        requerido
        minLength={8}
        error={e.passwordConfirmacion}
        autoComplete="new-password"
      />

      <div>
        <Boton type="submit" variante="contorno" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Restablecer contraseña"}
        </Boton>
      </div>
    </form>
  );
}

export function BotonEstadoTerapeuta({
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
