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
   Aportes: la foto del comprobante
   ------------------------------------------------------------------------- */

/**
 * El campo de la foto del comprobante, compartido por el aporte a campaña
 * desde la portada y el aporte del padrino desde el portal. El archivo no
 * pasa por Zod: se valida en el servidor con `validarBoleta`.
 */
export function CampoBoleta({
  error,
  tamanoMaximoMb,
}: {
  error?: string;
  tamanoMaximoMb: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="boleta" className="text-sm font-semibold text-ink">
        Foto del comprobante
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
        <span className="visually-hidden">(obligatorio)</span>
      </label>
      <p id="boleta-ayuda" className="medida-lectura text-xs text-ink-soft">
        La boleta del depósito, la captura de la transferencia o el recibo del
        pago con tarjeta, en JPG, PNG, WebP, HEIC (la foto tal cual sale del
        iPhone) o PDF, de {tamanoMaximoMb} MB como máximo. El archivo queda
        fuera de cualquier carpeta pública: solo lo abre quien revisa los
        aportes.
      </p>
      <input
        id="boleta"
        name="boleta"
        type="file"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        aria-describedby={error ? "boleta-ayuda boleta-error" : "boleta-ayuda"}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-brand-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-dark"
      />
      {error ? (
        <p id="boleta-error" role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Aporte a una campaña desde la portada
   ------------------------------------------------------------------------- */

export type OpcionCampana = { slug: string; titulo: string; general: boolean };

/**
 * Lo único obligatorio es la foto del comprobante. La campaña viene elegida
 * desde la portada y se puede cambiar; el nombre y el mensaje son opcionales.
 * No confirma nada: deja el aporte pendiente de que el administrador coteje
 * la foto contra el estado de cuenta y anote el monto.
 */
export function FormularioAporteCampana({
  accion,
  tamanoMaximoMb,
  campanas,
  campanaInicial,
  campanaFija,
}: {
  accion: Accion;
  tamanoMaximoMb: number;
  campanas: OpcionCampana[];
  campanaInicial?: string;
  /**
   * En la página de una campaña compartida en redes la campaña ya está
   * decidida: no se muestra el selector y viaja en un campo oculto.
   */
  campanaFija?: OpcionCampana;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const general = campanas.find((c) => c.general);
  const inicial =
    campanas.find((c) => c.slug === campanaInicial)?.slug ?? general?.slug ?? "";

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <Mensajes estado={estado} />

      {campanaFija ? (
        <>
          <input type="hidden" name="campana" value={campanaFija.slug} />
          {e.campana ? (
            <p role="alert" className="text-sm text-danger">
              {e.campana}
            </p>
          ) : null}
        </>
      ) : (
        <CampoSelect
          id="campana"
          name="campana"
          etiqueta="¿A qué va tu aporte?"
          ayuda="Elige una campaña o deja que se use donde más haga falta."
          defaultValue={inicial}
          error={e.campana}
        >
          {campanas.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.titulo}
            </option>
          ))}
        </CampoSelect>
      )}

      <CampoBoleta error={e.boleta} tamanoMaximoMb={tamanoMaximoMb} />

      <CampoTexto
        id="deParteDe"
        name="deParteDe"
        etiqueta="De parte de (opcional)"
        ayuda="Tu nombre o el de quien envía el aporte, si quieres que conste."
        maxLength={80}
        error={e.deParteDe}
        autoComplete="name"
      />

      <CampoArea
        id="mensaje"
        name="mensaje"
        etiqueta="Un mensaje para la campaña (opcional)"
        ayuda="Unas palabras de ánimo. Las lee el equipo del centro."
        rows={3}
        maxLength={500}
        error={e.mensaje}
      />

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Enviando…" : "Enviar mi aporte"}
        </Boton>
      </div>
    </form>
  );
}
