"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresInscripcion = {
  escolaridad: string;
  sector: string;
  telefono: string;
  solicitaPatrocinio: boolean;
  encargadoNombre: string;
  encargadoParentesco: string;
  encargadoSexo: string;
  encargadoEdad: string;
  encargadoIdentificacion: string;
  encargadoEstadoCivil: string;
  encargadoSituacionLaboral: string;
  encargadoEscolaridad: string;
  encargadoOficio: string;
  encargadoIntegrantes: string;
  encargadoDireccion: string;
  encargadoTelefono: string;
  encargadoEmail: string;
  ciclo: string;
  fechaInscripcion: string;
  tipoIngreso: string;
  fechaPrimerIngreso: string;
  referidoPor: string;
  areaServicio: string;
  responsableInscripcion: string;
  voBo: string;
  impresionClinica: string;
  otrasEnfermedades: string;
};

const claseGrupo = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
const claseLeyenda = "mb-3 font-heading text-lg font-semibold text-ink";

/**
 * Reproduce la hoja de inscripción: un solo envío escribe en beneficiario,
 * encargado e inscripción. Los datos del encargado vienen precargados con lo
 * que ya hubiera en su ficha, para que reinscribir sea confirmar y no recapturar.
 */
export function FormularioInscripcion({
  accion,
  beneficiarioId,
  inscripcionId,
  valores,
  areas,
  puedeClinico,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  beneficiarioId: string;
  /** Presente al corregir una ficha ya guardada; ausente al llenar una nueva. */
  inscripcionId?: string;
  valores: ValoresInscripcion;
  areas: string[];
  puedeClinico: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-8" noValidate>
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
      {inscripcionId ? (
        <input type="hidden" name="inscripcionId" value={inscripcionId} />
      ) : null}

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Datos del beneficiario</legend>
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
          etiqueta="Teléfono"
          defaultValue={valores.telefono}
          error={e.telefono}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={claseLeyenda}>Apoyo de un patrocinador</legend>
        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
          <input
            id="solicitaPatrocinio"
            name="solicitaPatrocinio"
            type="checkbox"
            defaultChecked={valores.solicitaPatrocinio}
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
            lo autorice. La terapia sigue igual, se le encuentre patrocinador o
            no.
          </label>
        </div>
      </fieldset>

      <fieldset className={claseGrupo}>
        <legend className={claseLeyenda}>Padre, madre o encargado</legend>
        <p className="medida-lectura text-sm text-ink-soft sm:col-span-2 lg:col-span-3">
          Si el encargado tiene otros beneficiarios inscritos, estos datos son
          los mismos para todos ellos.
        </p>
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
          defaultValue={valores.encargadoSexo}
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
          defaultValue={valores.encargadoEdad}
          error={e.encargadoEdad}
        />
        <CampoTexto
          id="encargadoIdentificacion"
          name="encargadoIdentificacion"
          etiqueta="No. de identificación"
          defaultValue={valores.encargadoIdentificacion}
          error={e.encargadoIdentificacion}
        />
        <CampoTexto
          id="encargadoEstadoCivil"
          name="encargadoEstadoCivil"
          etiqueta="Estado civil"
          defaultValue={valores.encargadoEstadoCivil}
          error={e.encargadoEstadoCivil}
        />
        <CampoSelect
          id="encargadoSituacionLaboral"
          name="encargadoSituacionLaboral"
          etiqueta="Situación laboral"
          defaultValue={valores.encargadoSituacionLaboral}
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
          defaultValue={valores.encargadoEscolaridad}
          error={e.encargadoEscolaridad}
        />
        <CampoTexto
          id="encargadoOficio"
          name="encargadoOficio"
          etiqueta="Oficio que desempeña"
          defaultValue={valores.encargadoOficio}
          error={e.encargadoOficio}
        />
        <CampoTexto
          id="encargadoIntegrantes"
          name="encargadoIntegrantes"
          type="number"
          min={0}
          etiqueta="No. de integrantes de la familia"
          defaultValue={valores.encargadoIntegrantes}
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
          etiqueta="Correo electrónico"
          defaultValue={valores.encargadoEmail}
          error={e.encargadoEmail}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <CampoTexto
            id="encargadoDireccion"
            name="encargadoDireccion"
            etiqueta="Dirección"
            defaultValue={valores.encargadoDireccion}
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
          defaultValue={valores.tipoIngreso}
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
          ayuda="En un reingreso, la fecha en que entró por primera vez."
          defaultValue={valores.fechaPrimerIngreso}
          error={e.fechaPrimerIngreso}
        />
        <CampoTexto
          id="referidoPor"
          name="referidoPor"
          etiqueta="Referido por"
          defaultValue={valores.referidoPor}
          error={e.referidoPor}
        />
        <CampoTexto
          id="areaServicio"
          name="areaServicio"
          etiqueta="Área de servicio"
          ayuda={
            areas.length > 0
              ? "Se sugieren las terapias anotadas en el expediente."
              : "La terapia o el área en la que ingresa este ciclo."
          }
          list="areaServicio-opciones"
          defaultValue={valores.areaServicio}
          error={e.areaServicio}
          autoComplete="off"
        />
        <datalist id="areaServicio-opciones">
          {areas.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
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
            ayuda="Lo que refiere la familia en la inscripción. El diagnóstico formal va en el expediente clínico."
            rows={3}
            defaultValue={valores.impresionClinica}
            error={e.impresionClinica}
          />
          <CampoArea
            id="otrasEnfermedades"
            name="otrasEnfermedades"
            etiqueta="Otras enfermedades asociadas"
            rows={3}
            defaultValue={valores.otrasEnfermedades}
            error={e.otrasEnfermedades}
          />
        </fieldset>
      ) : null}

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? "Guardando…"
            : inscripcionId
              ? "Guardar los cambios de la ficha"
              : "Guardar la ficha de inscripción"}
        </Boton>
      </div>
    </form>
  );
}
