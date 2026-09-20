"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { CampoCentro } from "@/components/campo-centro";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { DEPARTAMENTOS } from "@/lib/guatemala";

export type ValoresPapeleta = {
  solicitudId: string;
  codigoExpediente: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string;
  departamento: string;
  municipio: string;
  escolaridad: string;
  sector: string;
  telefono: string;
  centroAtencion: string;
  fechaIngreso: string;
  encargadoNombre: string;
  encargadoParentesco: string;
  encargadoTelefono: string;
  encargadoEmail: string;
  ciclo: string;
  fechaInscripcion: string;
  responsableInscripcion: string;
  voBo: string;
  impresionClinica: string;
};

const claseGrupo = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
const claseLeyenda = "mb-3 font-heading text-lg font-semibold text-ink";
const claseAncha = "sm:col-span-2 lg:col-span-3";

/**
 * La hoja de inscripción de un ingreso nuevo. Lo que la familia mandó desde el
 * sitio público viene ya escrito y se puede corregir; lo demás se captura aquí.
 *
 * Es un solo envío: hasta que no se acepta no existe ni el beneficiario ni su
 * encargado, así que no hay nada que guardar a medias.
 */
export function FormularioPapeleta({
  accion,
  valores,
  puedeClinico,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  valores: ValoresPapeleta;
  puedeClinico: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-8" noValidate>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="solicitudId" value={valores.solicitudId} />

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Datos del niño o adolescente</legend>
        <CampoTexto
          id="nombres"
          name="nombres"
          etiqueta="Nombres"
          requerido
          defaultValue={valores.nombres}
          error={e.nombres}
          autoComplete="off"
        />
        <CampoTexto
          id="apellidos"
          name="apellidos"
          etiqueta="Apellidos"
          requerido
          defaultValue={valores.apellidos}
          error={e.apellidos}
          autoComplete="off"
        />
        <CampoTexto
          id="fechaNacimiento"
          name="fechaNacimiento"
          type="date"
          etiqueta="Fecha de nacimiento"
          requerido
          defaultValue={valores.fechaNacimiento}
          error={e.fechaNacimiento}
        />
        <CampoSelect
          id="sexo"
          name="sexo"
          etiqueta="Sexo"
          requerido
          defaultValue={valores.sexo}
          error={e.sexo}
        >
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
        </CampoSelect>
        <CampoSelect
          id="departamento"
          name="departamento"
          etiqueta="Departamento"
          requerido
          defaultValue={valores.departamento}
          error={e.departamento}
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
          defaultValue={valores.municipio}
          error={e.municipio}
        />
        <CampoTexto
          id="escolaridad"
          name="escolaridad"
          etiqueta="Escolaridad"
          ayuda="Grado que cursa o «No escolarizado»."
          defaultValue={valores.escolaridad}
          error={e.escolaridad}
        />
        <CampoTexto
          id="sector"
          name="sector"
          etiqueta="Sector o caserío"
          defaultValue={valores.sector}
          error={e.sector}
        />
        <CampoTexto
          id="telefono"
          name="telefono"
          etiqueta="Teléfono del hogar"
          defaultValue={valores.telefono}
          error={e.telefono}
        />
      </fieldset>

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Apertura del expediente</legend>
        <p className={`medida-lectura text-sm text-ink-soft ${claseAncha}`}>
          Esto no lo contesta la familia: lo decide el centro al aceptar.
        </p>
        <CampoTexto
          id="codigoExpediente"
          name="codigoExpediente"
          etiqueta="Código de expediente"
          ayuda="Se propone el siguiente de la serie."
          requerido
          defaultValue={valores.codigoExpediente}
          error={e.codigoExpediente}
          autoComplete="off"
        />
        <CampoCentro
          defaultValue={valores.centroAtencion}
          error={e.centroAtencion}
          ayuda="Donde recibirá la terapia: San Pedro o Posonicapa, en Cuilco."
        />
        <CampoTexto
          id="fechaIngreso"
          name="fechaIngreso"
          type="date"
          etiqueta="Fecha de ingreso"
          requerido
          defaultValue={valores.fechaIngreso}
          error={e.fechaIngreso}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={claseLeyenda}>Apoyo de un patrocinador</legend>
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
          <input
            id="solicitaPatrocinio"
            name="solicitaPatrocinio"
            type="checkbox"
            className="mt-1 size-4 rounded border-line"
          />
          <label
            htmlFor="solicitaPatrocinio"
            className="medida-lectura text-sm text-ink"
          >
            <span className="font-semibold">
              La familia desea que se le busque un patrocinador.
            </span>{" "}
            Es una petición, no una publicación: para que sus datos y su foto
            salgan en la página pública hace falta además que la administración
            lo autorice.
          </label>
        </div>
      </fieldset>

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Padre, madre o encargado</legend>
        <CampoTexto
          id="encargadoNombre"
          name="encargadoNombre"
          etiqueta="Nombre completo"
          requerido
          defaultValue={valores.encargadoNombre}
          error={e.encargadoNombre}
        />
        <CampoTexto
          id="encargadoParentesco"
          name="encargadoParentesco"
          etiqueta="Parentesco"
          defaultValue={valores.encargadoParentesco}
          error={e.encargadoParentesco}
        />
        <CampoSelect
          id="encargadoSexo"
          name="encargadoSexo"
          etiqueta="Sexo"
          defaultValue=""
          error={e.encargadoSexo}
        >
          <option value="">Sin indicar</option>
          <option value="FEMENINO">F</option>
          <option value="MASCULINO">M</option>
        </CampoSelect>
        <CampoTexto
          id="encargadoEdad"
          name="encargadoEdad"
          type="number"
          min={0}
          max={120}
          etiqueta="Edad"
          error={e.encargadoEdad}
        />
        <CampoTexto
          id="encargadoIdentificacion"
          name="encargadoIdentificacion"
          etiqueta="No. de identificación"
          error={e.encargadoIdentificacion}
        />
        <CampoTexto
          id="encargadoEstadoCivil"
          name="encargadoEstadoCivil"
          etiqueta="Estado civil"
          error={e.encargadoEstadoCivil}
        />
        <CampoSelect
          id="encargadoSituacionLaboral"
          name="encargadoSituacionLaboral"
          etiqueta="Situación laboral"
          defaultValue=""
          error={e.encargadoSituacionLaboral}
        >
          <option value="">Sin indicar</option>
          <option value="EMPLEADO">Empleado</option>
          <option value="DESEMPLEADO">Desempleado</option>
        </CampoSelect>
        <CampoTexto
          id="encargadoEscolaridad"
          name="encargadoEscolaridad"
          etiqueta="Escolaridad"
          error={e.encargadoEscolaridad}
        />
        <CampoTexto
          id="encargadoOficio"
          name="encargadoOficio"
          etiqueta="Oficio que desempeña"
          error={e.encargadoOficio}
        />
        <CampoTexto
          id="encargadoIntegrantes"
          name="encargadoIntegrantes"
          type="number"
          min={0}
          etiqueta="No. de integrantes de la familia"
          error={e.encargadoIntegrantes}
        />
        <CampoTexto
          id="encargadoTelefono"
          name="encargadoTelefono"
          etiqueta="Teléfono"
          defaultValue={valores.encargadoTelefono}
          error={e.encargadoTelefono}
        />
        <CampoTexto
          id="encargadoEmail"
          name="encargadoEmail"
          type="email"
          etiqueta="Correo electrónico (opcional)"
          defaultValue={valores.encargadoEmail}
          error={e.encargadoEmail}
        />
        <div className={claseAncha}>
          <CampoTexto
            id="encargadoDireccion"
            name="encargadoDireccion"
            etiqueta="Dirección"
            error={e.encargadoDireccion}
          />
        </div>
      </fieldset>

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Datos de la inscripción</legend>
        <CampoTexto
          id="ciclo"
          name="ciclo"
          type="number"
          min={2000}
          max={2100}
          etiqueta="Ciclo"
          requerido
          defaultValue={valores.ciclo}
          error={e.ciclo}
        />
        <CampoTexto
          id="fechaInscripcion"
          name="fechaInscripcion"
          type="date"
          etiqueta="Fecha de inscripción"
          requerido
          defaultValue={valores.fechaInscripcion}
          error={e.fechaInscripcion}
        />
        <CampoSelect
          id="tipoIngreso"
          name="tipoIngreso"
          etiqueta="Tipo de ingreso"
          requerido
          defaultValue="PRIMER_INGRESO"
          error={e.tipoIngreso}
        >
          <option value="PRIMER_INGRESO">Primer ingreso</option>
          <option value="REINGRESO">Reingreso</option>
        </CampoSelect>
        <CampoTexto
          id="fechaPrimerIngreso"
          name="fechaPrimerIngreso"
          type="date"
          etiqueta="Fecha de primer ingreso"
          ayuda="Solo si ya había estado antes en el centro."
          error={e.fechaPrimerIngreso}
        />
        <CampoTexto
          id="referidoPor"
          name="referidoPor"
          etiqueta="Referido por"
          error={e.referidoPor}
        />
        <CampoTexto
          id="areaServicio"
          name="areaServicio"
          etiqueta="Área de servicio"
          ayuda="La terapia o el área en la que ingresa. Las terapias del niño se anotan después en su expediente."
          error={e.areaServicio}
          autoComplete="off"
        />
        <CampoTexto
          id="responsableInscripcion"
          name="responsableInscripcion"
          etiqueta="Responsable de la inscripción"
          requerido
          defaultValue={valores.responsableInscripcion}
          error={e.responsableInscripcion}
        />
        <CampoTexto
          id="voBo"
          name="voBo"
          etiqueta="Vo.Bo."
          defaultValue={valores.voBo}
          error={e.voBo}
        />
      </fieldset>

      {puedeClinico ? (
        <fieldset className="flex flex-col gap-5">
          <legend className={claseLeyenda}>Impresión clínica</legend>
          <CampoArea
            id="impresionClinica"
            name="impresionClinica"
            etiqueta="Impresión clínica"
            ayuda="Lo que refiere la familia en la inscripción. Viene de la solicitud y se puede ampliar. El diagnóstico formal va en el expediente clínico."
            rows={3}
            defaultValue={valores.impresionClinica}
            error={e.impresionClinica}
          />
          <CampoArea
            id="otrasEnfermedades"
            name="otrasEnfermedades"
            etiqueta="Otras enfermedades asociadas"
            rows={3}
            error={e.otrasEnfermedades}
          />
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Aceptando…" : "Aceptar y crear el beneficiario"}
        </Boton>
        <p className="medida-lectura text-sm text-ink-soft">
          Al aceptar se crean el expediente, su encargado y la ficha del ciclo
          de una sola vez.
        </p>
      </div>
    </form>
  );
}
