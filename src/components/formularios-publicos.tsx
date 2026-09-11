"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import {
  DEPARTAMENTOS,
  DEPARTAMENTO_PREDETERMINADO,
  MUNICIPIO_PREDETERMINADO,
} from "@/lib/guatemala";
import { ESTADO_INICIAL } from "@/lib/formularios";
import type { EstadoFormulario } from "@/lib/formularios";

type Accion = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

function Mensajes({ estado }: { estado: EstadoFormulario }) {
  if (estado.ok) return <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario>;
  if (estado.error)
    return <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>;
  return null;
}

/* -------------------------------------------------------------------------
   Inscripción de beneficiarios
   ------------------------------------------------------------------------- */

export function FormularioBeneficiario({ accion }: { accion: Accion }) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-6" noValidate>
      <Mensajes estado={estado} />

      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg font-semibold text-ink">
          Datos del niño o adolescente
        </legend>
        <CampoTexto
          id="nombreNino"
          name="nombreNino"
          etiqueta="Nombre completo"
          requerido
          error={e.nombreNino}
          autoComplete="off"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            etiqueta="Fecha de nacimiento"
            requerido
            error={e.fechaNacimiento}
          />
          <CampoSelect
            id="sexo"
            name="sexo"
            etiqueta="Sexo"
            requerido
            error={e.sexo}
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </CampoSelect>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoSelect
            id="departamento"
            name="departamento"
            etiqueta="Departamento"
            requerido
            defaultValue={DEPARTAMENTO_PREDETERMINADO}
            error={e.departamento}
            autoComplete="address-level1"
          >
            {DEPARTAMENTOS.map((departamento) => (
              <option key={departamento} value={departamento}>
                {departamento}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            id="municipio"
            name="municipio"
            etiqueta="Municipio"
            requerido
            defaultValue={MUNICIPIO_PREDETERMINADO}
            error={e.municipio}
            autoComplete="address-level2"
          />
        </div>
        <CampoTexto
          id="diagnostico"
          name="diagnostico"
          etiqueta="Diagnóstico (si lo tienen)"
          ayuda="Si aún no hay diagnóstico, déjalo en blanco: la evaluación inicial es parte del proceso."
          error={e.diagnostico}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg font-semibold text-ink">
          Datos del encargado
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id="encargadoNombre"
            name="encargadoNombre"
            etiqueta="Nombre del encargado"
            requerido
            error={e.encargadoNombre}
            autoComplete="name"
          />
          <CampoTexto
            id="encargadoParentesco"
            name="encargadoParentesco"
            etiqueta="Parentesco"
            requerido
            error={e.encargadoParentesco}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id="encargadoTelefono"
            name="encargadoTelefono"
            etiqueta="Teléfono"
            requerido
            error={e.encargadoTelefono}
            autoComplete="tel"
          />
          <CampoTexto
            id="encargadoEmail"
            name="encargadoEmail"
            type="email"
            etiqueta={
              <>
                Correo electrónico{" "}
                <em className="font-normal text-ink-soft">(opcional)</em>
              </>
            }
            error={e.encargadoEmail}
            autoComplete="email"
          />
        </div>
        <CampoArea
          id="comentarios"
          name="comentarios"
          etiqueta="¿Algo más que debamos saber?"
          error={e.comentarios}
        />
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Enviando…" : "Enviar inscripción"}
        </Boton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Inscripción de padrinos
   ------------------------------------------------------------------------- */

export function FormularioPadrino({
  accion,
  aporteSugerido,
}: {
  accion: Accion;
  aporteSugerido: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      <CampoTexto
        id="nombre"
        name="nombre"
        etiqueta="Nombre completo o razón social"
        requerido
        error={e.nombre}
        autoComplete="name"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="email"
          name="email"
          type="email"
          etiqueta="Correo electrónico"
          ayuda="Con este correo se creará tu acceso al portal del padrino."
          requerido
          error={e.email}
          autoComplete="email"
        />
        <CampoTexto
          id="telefono"
          name="telefono"
          etiqueta="Teléfono"
          requerido
          error={e.telefono}
          autoComplete="tel"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="ocupacion"
          name="ocupacion"
          etiqueta="Ocupación"
          error={e.ocupacion}
        />
        <CampoTexto
          id="aporteMensual"
          name="aporteMensual"
          type="number"
          min={50}
          step={25}
          etiqueta="Aporte mensual (quetzales)"
          ayuda={`El aporte sugerido es de Q${aporteSugerido} al mes. Puedes ajustarlo.`}
          defaultValue={aporteSugerido}
          error={e.aporteMensual}
        />
      </div>
      <CampoArea
        id="motivacion"
        name="motivacion"
        etiqueta="¿Por qué quieres apadrinar?"
        error={e.motivacion}
      />

      <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
        <legend className="font-heading text-lg font-semibold text-ink">
          Tu acceso al portal
        </legend>
        <p className="medida-lectura text-sm text-ink-soft">
          Con el correo de arriba y esta contraseña entrarás al portal del
          padrino para seguir los avances de tu apadrinado.
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
          {pendiente ? "Creando tu cuenta…" : "Crear cuenta e inscribirme"}
        </Boton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Contacto
   ------------------------------------------------------------------------- */

export function FormularioContacto({ accion }: { accion: Accion }) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          name="nombre"
          etiqueta="Nombre"
          requerido
          error={e.nombre}
          autoComplete="name"
        />
        <CampoTexto
          id="email"
          name="email"
          type="email"
          etiqueta="Correo electrónico"
          requerido
          error={e.email}
          autoComplete="email"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="telefono"
          name="telefono"
          etiqueta="Teléfono"
          error={e.telefono}
          autoComplete="tel"
        />
        <CampoTexto
          id="asunto"
          name="asunto"
          etiqueta="Asunto"
          requerido
          error={e.asunto}
        />
      </div>
      <CampoArea
        id="mensaje"
        name="mensaje"
        etiqueta="Mensaje"
        rows={6}
        requerido
        error={e.mensaje}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Enviando…" : "Enviar mensaje"}
        </Boton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Donación
   ------------------------------------------------------------------------- */

export function FormularioDonacion({
  accion,
  campanas,
  montoSugerido,
}: {
  accion: Accion;
  campanas: { id: string; titulo: string }[];
  montoSugerido: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="donanteNombre"
          name="donanteNombre"
          etiqueta="Nombre"
          requerido
          error={e.donanteNombre}
          autoComplete="name"
        />
        <CampoTexto
          id="donanteEmail"
          name="donanteEmail"
          type="email"
          etiqueta="Correo electrónico"
          ayuda="Ahí te llegará el comprobante de la donación."
          requerido
          error={e.donanteEmail}
          autoComplete="email"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="monto"
          name="monto"
          type="number"
          min={25}
          step={25}
          etiqueta="Monto en quetzales"
          requerido
          defaultValue={montoSugerido}
          error={e.monto}
        />
        <CampoSelect
          id="metodo"
          name="metodo"
          etiqueta="Método de pago"
          requerido
          error={e.metodo}
          defaultValue="TARJETA"
        >
          <option value="TARJETA">Tarjeta de crédito o débito</option>
          <option value="TRANSFERENCIA">Transferencia bancaria</option>
          <option value="DEPOSITO">Depósito en agencia</option>
        </CampoSelect>
      </div>

      <CampoSelect
        id="campaignId"
        name="campaignId"
        etiqueta="Destinar a una campaña"
        defaultValue=""
      >
        <option value="">Donde más se necesite</option>
        {campanas.map((campana) => (
          <option key={campana.id} value={campana.id}>
            {campana.titulo}
          </option>
        ))}
      </CampoSelect>

      <div className="flex items-start gap-3">
        <input
          id="recurrente"
          name="recurrente"
          type="checkbox"
          className="mt-1 size-4 rounded border-line"
        />
        <label htmlFor="recurrente" className="text-sm text-ink">
          Quiero que este aporte se repita cada mes
        </label>
      </div>

      <CampoArea
        id="mensaje"
        name="mensaje"
        etiqueta="Mensaje para el equipo (opcional)"
        rows={3}
        error={e.mensaje}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Procesando…" : "Continuar al pago"}
        </Boton>
      </div>
    </form>
  );
}
