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
   Pago en línea
   ------------------------------------------------------------------------- */

/**
 * Lo único que se pregunta es cuánto. Nombre, correo y datos de la tarjeta son
 * asunto de la pasarela, y este sitio no los guarda.
 */
export function FormularioPasarela({
  accion,
  montoSugerido,
}: {
  accion: Accion;
  montoSugerido: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      <CampoTexto
        id="monto"
        name="monto"
        type="number"
        min={25}
        step={25}
        etiqueta="¿Cuánto quieres aportar?"
        ayuda="En quetzales. El mínimo es de Q25."
        requerido
        defaultValue={montoSugerido}
        error={e.monto}
        className="max-w-xs"
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Procesando…" : "Continuar al pago"}
        </Boton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Donativo depositado en el banco
   ------------------------------------------------------------------------- */

/**
 * El camino más corto: la boleta y, si el donante quiere, a qué niño va
 * dirigida. Ni nombre, ni correo, ni monto. No confirma nada: deja el donativo
 * pendiente de que el equipo coteje la boleta contra el estado de cuenta.
 */
export function FormularioDonativoDirecto({
  accion,
  tamanoMaximoMb,
}: {
  accion: Accion;
  tamanoMaximoMb: number;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      <CampoTexto
        id="destinoNino"
        name="destinoNino"
        etiqueta="¿A qué niño va dirigido? (opcional)"
        ayuda="Escribe su código o su nombre, como lo recuerdes. Si lo dejas en blanco, tu donativo se usa donde más haga falta."
        maxLength={120}
        error={e.destinoNino}
        autoComplete="off"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="boleta" className="text-sm font-semibold text-ink">
          Foto o PDF de la boleta
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
          <span className="visually-hidden">(obligatorio)</span>
        </label>
        <p id="boleta-ayuda" className="medida-lectura text-xs text-ink-soft">
          La boleta sellada o el comprobante que da la banca en línea, en JPG,
          PNG, WebP, HEIC (la foto tal cual sale del iPhone) o PDF, de{" "}
          {tamanoMaximoMb} MB como máximo. El archivo queda fuera de cualquier
          carpeta pública: solo lo abre el personal que revisa los aportes.
        </p>
        <input
          id="boleta"
          name="boleta"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          aria-describedby={e.boleta ? "boleta-ayuda boleta-error" : "boleta-ayuda"}
          aria-invalid={e.boleta ? true : undefined}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {e.boleta ? (
          <p
            id="boleta-error"
            role="alert"
            className="text-xs font-medium text-danger"
          >
            {e.boleta}
          </p>
        ) : null}
      </div>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Enviando…" : "Enviar mi donativo"}
        </Boton>
      </div>
    </form>
  );
}
