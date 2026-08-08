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

export type ValoresBeneficiario = {
  id: string;
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
  encargadoNombre: string;
  encargadoParentesco: string;
  encargadoTelefono: string;
  encargadoEmail: string;
  programaId: string;
  estado: string;
  estadoExpediente: string;
  publicadoEnGaleria: boolean;
  resumenPublico: string;
};

export function FormularioEditar({
  accion,
  valores,
  programas,
}: {
  accion: (
    estado: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  valores: ValoresBeneficiario;
  programas: { id: string; nombre: string }[];
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-8" noValidate>
      {estado.ok ? <MensajeFormulario tipo="ok">{estado.ok}</MensajeFormulario> : null}
      {estado.error ? (
        <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>
      ) : null}

      <input type="hidden" name="id" value={valores.id} />

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Identificación
        </legend>
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
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Encargado
        </legend>
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
          etiqueta="Correo electrónico"
          defaultValue={valores.encargadoEmail}
          error={e.encargadoEmail}
        />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Programa y estado
        </legend>
        <CampoSelect
          id="programaId"
          name="programaId"
          etiqueta="Programa"
          requerido
          defaultValue={valores.programaId}
          error={e.programaId}
        >
          {programas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </CampoSelect>
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
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 font-heading text-lg font-semibold text-ink">
          Publicación en la galería
        </legend>
        <div className="flex items-start gap-3">
          <input
            id="publicadoEnGaleria"
            name="publicadoEnGaleria"
            type="checkbox"
            defaultChecked={valores.publicadoEnGaleria}
            className="mt-1 size-4 rounded border-line"
          />
          <label htmlFor="publicadoEnGaleria" className="medida-lectura text-sm text-ink">
            Publicar en la galería pública. Solo se muestran el primer nombre,
            la edad y el programa; nunca apellidos, diagnóstico ni datos
            familiares.
          </label>
        </div>
        <CampoArea
          id="resumenPublico"
          name="resumenPublico"
          etiqueta="Resumen público"
          ayuda="Texto breve que aparece en la galería. Evita cualquier dato identificable o clínico."
          defaultValue={valores.resumenPublico}
          error={e.resumenPublico}
        />
      </fieldset>

      <div>
        <Boton type="submit" disabled={pendiente} className="px-6 py-3">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
