"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoTexto,
  Chip,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type OpcionRol = {
  clave: string;
  nombre: string;
  descripcion: string | null;
  permisos: number;
};

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

/**
 * Los permisos no se editan desde aquí: el límite de una cuenta es el de sus
 * roles, y cada casilla dice cuántos permisos concede para que la decisión se
 * tome con el dato a la vista. El detalle está en la matriz de más abajo.
 */
function SelectorRoles({
  roles,
  seleccionados,
  error,
}: {
  roles: OpcionRol[];
  seleccionados: string[];
  error?: string;
}) {
  const idError = error ? "roles-error" : undefined;

  return (
    <fieldset
      aria-describedby={idError}
      aria-invalid={error ? true : undefined}
      className="flex flex-col gap-3"
    >
      <legend className="text-sm font-semibold text-ink">
        Roles asignados
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
        <span className="visually-hidden">(obligatorio)</span>
      </legend>
      <p className="medida-lectura text-xs text-ink-soft">
        Cada rol trae sus permisos ya definidos. Puedes marcar más de uno si la
        persona cubre dos funciones.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {roles.map((rol) => (
          <li key={rol.clave}>
            <label
              htmlFor={`rol-${rol.clave}`}
              className="flex h-full items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4 hover:border-brand-primary"
            >
              <input
                id={`rol-${rol.clave}`}
                name="roles"
                type="checkbox"
                value={rol.clave}
                defaultChecked={seleccionados.includes(rol.clave)}
                className="mt-1 size-4 shrink-0 rounded border-line"
              />
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {rol.nombre}
                  </span>
                  <Chip tono="info">
                    {rol.permisos} {rol.permisos === 1 ? "permiso" : "permisos"}
                  </Chip>
                </span>
                {rol.descripcion ? (
                  <span className="mt-1 block text-xs text-ink-soft">
                    {rol.descripcion}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {error ? (
        <p id={idError} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function FormularioNuevoUsuario({
  accion,
  roles,
}: {
  accion: Accion;
  roles: OpcionRol[];
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
        etiqueta="Cargo"
        ayuda="Por ejemplo: Terapeuta del lenguaje, Trabajadora social."
        error={e.cargo}
        autoComplete="off"
      />

      <SelectorRoles roles={roles} seleccionados={[]} error={e.roles} />

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
          {pendiente ? "Creando…" : "Crear cuenta"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioEditarUsuario({
  accion,
  id,
  nombre,
  cargo,
  roles,
  seleccionados,
}: {
  accion: Accion;
  id: string;
  nombre: string;
  cargo: string | null;
  roles: OpcionRol[];
  seleccionados: string[];
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
          etiqueta="Cargo"
          defaultValue={cargo ?? ""}
          error={e.cargo}
        />
      </div>

      <SelectorRoles
        roles={roles}
        seleccionados={seleccionados}
        error={e.roles}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioContrasena({
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

      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>

      <div>
        <Boton
          type="submit"
          variante="contorno"
          disabled={pendiente}
          className="px-6 py-3"
        >
          {pendiente ? "Guardando…" : "Restablecer contraseña"}
        </Boton>
      </div>
    </form>
  );
}
