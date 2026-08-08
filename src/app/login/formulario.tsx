"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Boton, CampoTexto, MensajeFormulario } from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export function FormularioLogin({
  accion,
  redirigir,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  redirigir: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="redirigir" value={redirigir} />

      <CampoTexto
        id="email"
        name="email"
        type="email"
        etiqueta="Correo electrónico"
        requerido
        autoComplete="username"
        placeholder="usuario@cernace.org"
      />
      <CampoTexto
        id="password"
        name="password"
        type="password"
        etiqueta="Contraseña"
        requerido
        autoComplete="current-password"
      />

      <Boton type="submit" disabled={pendiente} className="py-3">
        <LogIn aria-hidden="true" className="size-4" />
        {pendiente ? "Verificando…" : "Iniciar sesión"}
      </Boton>
    </form>
  );
}
