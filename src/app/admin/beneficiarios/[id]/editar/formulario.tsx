"use client";

import { useActionState } from "react";
import {
  Boton,
  CampoSelect,
  CampoTexto,
  MensajeFormulario,
} from "@/components/ui";
import { CampoCentro } from "@/components/campo-centro";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresBeneficiario = {
  /** Vacío al abrir un expediente nuevo: todavía no hay fila que actualizar. */
  id: string;
  codigoExpediente: string;
  fechaIngreso: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string;
  cui: string;
  lugarNacimiento: string;
  idiomaHogar: string;
  tipoSangre: string;
  direccion: string;
  municipio: string;
  departamento: string;
  zonaResidencia: string;
  sector: string;
  escolaridad: string;
  telefono: string;
  encargadoNombre: string;
  encargadoParentesco: string;
  encargadoTelefono: string;
  encargadoEmail: string;
  encargadoSexo: string;
  encargadoEdad: string;
  encargadoIdentificacion: string;
  encargadoEstadoCivil: string;
  encargadoSituacionLaboral: string;
  encargadoEscolaridad: string;
  encargadoOficio: string;
  encargadoIntegrantes: string;
  encargadoDireccion: string;
  centroAtencion: string;
  solicitaPatrocinio: boolean;
  estado: string;
  estadoExpediente: string;
};

export function FormularioEditar({
  accion,
  valores,
  modo = "editar",
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  valores: ValoresBeneficiario;
  /** El mismo formulario abre expedientes y los corrige: los campos son los
   *  mismos y así no se separan con el tiempo. Lo único que cambia es el `id`
   *  oculto, los textos de ayuda y el botón. */
  modo?: "editar" | "crear";
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};
  const creando = modo === "crear";

  return (
    <form action={enviar} className="flex flex-col gap-8" noValidate>
      {estado.ok ? <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario> : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      {creando ? null : (
        <input type="hidden" name="id" value={valores.id} />
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Identificación
        </legend>
        <CampoTexto
          id="codigoExpediente"
          name="codigoExpediente"
          etiqueta="Código de expediente"
          ayuda={
            creando
              ? "Se propone el siguiente de la serie; cámbialo si el expediente ya traía número."
              : "Cambiarlo renombra el expediente en todo el sistema. Solo si estaba mal."
          }
          requerido
          defaultValue={valores.codigoExpediente}
          error={e.codigoExpediente}
          autoComplete="off"
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
        <CampoTexto
          id="nombres"
          name="nombres"
          etiqueta="Nombres"
          requerido
          defaultValue={valores.nombres}
          error={e.nombres}
        />
        <CampoTexto
          id="apellidos"
          name="apellidos"
          etiqueta="Apellidos"
          requerido
          defaultValue={valores.apellidos}
          error={e.apellidos}
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
        <CampoTexto
          id="cui"
          name="cui"
          etiqueta="CUI"
          defaultValue={valores.cui}
          error={e.cui}
        />
        <CampoTexto
          id="lugarNacimiento"
          name="lugarNacimiento"
          etiqueta="Lugar de nacimiento"
          defaultValue={valores.lugarNacimiento}
          error={e.lugarNacimiento}
        />
        <CampoTexto
          id="idiomaHogar"
          name="idiomaHogar"
          etiqueta="Idioma del hogar"
          defaultValue={valores.idiomaHogar}
          error={e.idiomaHogar}
        />
        <CampoTexto
          id="tipoSangre"
          name="tipoSangre"
          etiqueta="Tipo de sangre"
          defaultValue={valores.tipoSangre}
          error={e.tipoSangre}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Residencia
        </legend>
        <CampoTexto
          id="direccion"
          name="direccion"
          etiqueta="Dirección"
          defaultValue={valores.direccion}
          error={e.direccion}
          className="lg:col-span-2"
        />
        <CampoTexto
          id="zonaResidencia"
          name="zonaResidencia"
          etiqueta="Zona o área"
          defaultValue={valores.zonaResidencia}
          error={e.zonaResidencia}
        />
        <CampoTexto
          id="municipio"
          name="municipio"
          etiqueta="Municipio"
          requerido
          defaultValue={valores.municipio}
          error={e.municipio}
        />
        <CampoTexto
          id="departamento"
          name="departamento"
          etiqueta="Departamento"
          requerido
          defaultValue={valores.departamento}
          error={e.departamento}
        />
        <CampoTexto
          id="sector"
          name="sector"
          etiqueta="Sector o caserío"
          defaultValue={valores.sector}
          error={e.sector}
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
          id="telefono"
          name="telefono"
          etiqueta="Teléfono del beneficiario"
          defaultValue={valores.telefono}
          error={e.telefono}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Encargado
        </legend>
        <p className="medida-lectura text-sm text-ink-soft sm:col-span-2 lg:col-span-3">
          {creando
            ? "Se crea una ficha de encargado nueva con estos datos. Si el encargado ya tiene otros beneficiarios inscritos, une las fichas después desde el expediente."
            : "Estos datos pertenecen a la ficha del encargado. Si tiene otros beneficiarios inscritos, el cambio les alcanza también."}
        </p>
        <CampoTexto
          id="encargadoNombre"
          name="encargadoNombre"
          etiqueta="Nombre del encargado"
          requerido
          defaultValue={valores.encargadoNombre}
          error={e.encargadoNombre}
        />
        <CampoTexto
          id="encargadoParentesco"
          name="encargadoParentesco"
          etiqueta="Parentesco"
          requerido
          defaultValue={valores.encargadoParentesco}
          error={e.encargadoParentesco}
        />
        <CampoTexto
          id="encargadoTelefono"
          name="encargadoTelefono"
          etiqueta="Teléfono"
          requerido
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
        <CampoSelect
          id="encargadoSexo"
          name="encargadoSexo"
          etiqueta="Sexo"
          defaultValue={valores.encargadoSexo}
          error={e.encargadoSexo}
        >
          <option value="">Sin indicar</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
        </CampoSelect>
        <CampoTexto
          id="encargadoEdad"
          name="encargadoEdad"
          type="number"
          min={0}
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
          etiqueta="Escolaridad del encargado"
          defaultValue={valores.encargadoEscolaridad}
          error={e.encargadoEscolaridad}
        />
        <CampoTexto
          id="encargadoOficio"
          name="encargadoOficio"
          etiqueta="Oficio"
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
          id="encargadoDireccion"
          name="encargadoDireccion"
          etiqueta="Dirección del encargado"
          defaultValue={valores.encargadoDireccion}
          error={e.encargadoDireccion}
          className="lg:col-span-2"
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Centro y estado
        </legend>
        <CampoCentro
          defaultValue={valores.centroAtencion}
          error={e.centroAtencion}
        />
        <CampoSelect
          id="estado"
          name="estado"
          etiqueta="Estado del beneficiario"
          requerido
          defaultValue={valores.estado}
          error={e.estado}
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="EGRESADO">Egresado</option>
        </CampoSelect>
        <CampoSelect
          id="estadoExpediente"
          name="estadoExpediente"
          etiqueta="Estado del expediente"
          requerido
          defaultValue={valores.estadoExpediente}
          error={e.estadoExpediente}
        >
          <option value="COMPLETO">Completo</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="INCOMPLETO">Incompleto</option>
        </CampoSelect>

        <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4 sm:col-span-2 lg:col-span-3">
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
              La familia pide que se le busque padrino.
            </span>{" "}
            Es la petición de la familia, no la autorización para publicarlo:
            esa se da aparte, en Publicación, y hacen falta las dos para que
            salga en el sitio con su foto principal.
          </label>
        </div>
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente
            ? creando
              ? "Abriendo…"
              : "Guardando…"
            : creando
              ? "Abrir expediente"
              : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
