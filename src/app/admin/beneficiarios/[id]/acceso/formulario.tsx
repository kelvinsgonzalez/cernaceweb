"use client";

import { useActionState } from "react";
import { Boton, CampoTexto, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export function FormularioAcceso({
  accion,
  beneficiarioId,
  nombreSugerido,
  emailSugerido,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  nombreSugerido: string;
  emailSugerido: string;
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

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="A nombre de"
          ayuda="Normalmente el encargado, que es quien entrará."
          requerido
          defaultValue={nombreSugerido}
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
          defaultValue={emailSugerido}
          error={e.email}
          autoComplete="off"
        />
      </div>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
        <legend className="text-sm font-semibold text-ink">
          Contraseña inicial
        </legend>
        <p className="medida-lectura text-xs text-ink-soft">
          La plataforma no envía correos: tendrás que dársela en persona o por un
          medio seguro, y pedirle que la cambie.
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
          {pendiente ? "Creando…" : "Crear el acceso"}
        </Boton>
      </div>
    </form>
  );
}
