import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { ChipSolicitud } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import {
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import { calcularEdad, formatFecha } from "@/lib/fechas";
import {
  aceptarSolicitudEntrante,
  eliminarBandejaSolicitudes,
  eliminarSolicitud,
} from "./acciones";

export const metadata: Metadata = { title: "Solicitudes de inscripción" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Niño o adolescente",
  "Edad",
  "Procedencia",
  "Encargado",
  "Programa solicitado",
  "Recibida",
  "Estado",
  "Acciones",
];

export default async function SolicitudesPage() {
  const usuario = await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);
  // Aceptar lleva a la papeleta, que es de Inscripciones: sin poder escribir en
  // el expediente el botón no llevaría a ninguna parte.
  const puedeInscribir = tienePermiso(usuario, PERMISOS.EXPEDIENTE_ESCRIBIR);

  // Esta bandeja es solo lo entrante sin atender. En cuanto se resuelve —se
  // acepta o se elimina— sale de aquí: la aceptada continúa en Inscripciones y
  // la que ya abrió expediente queda en el historial de solicitudes archivadas.
  const enBandeja = { archivada: false, estado: "NUEVA" } as const;

  const solicitudes = await prisma.supportRequest.findMany({
    where: enBandeja,
    orderBy: { createdAt: "desc" },
  });

  // «las 1 solicitudes» no se lee: la bandeja se vacía igual con una que con diez.
  const bandeja =
    solicitudes.length === 1
      ? "la solicitud sin atender"
      : `las ${solicitudes.length} solicitudes sin atender`;

  return (
    <>
      <EncabezadoPagina
        titulo="Solicitudes"
        descripcion="Inscripciones recibidas desde el sitio público que nadie ha atendido todavía. Al aceptar una sale de esta bandeja y continúa en Inscripciones, donde se llena su papeleta."
        acciones={
          solicitudes.length > 0 ? (
            <MenuAcciones
              id="bandeja"
              variante="texto"
              etiqueta="Acciones de la bandeja"
              titulo={`${solicitudes.length} sin atender`}
            >
              <OpcionConfirmada
                menu="bandeja"
                tono="peligro"
                etiqueta={`Eliminar ${bandeja}`}
                mensaje={`Esto borra de la base ${bandeja}. No hay vuelta atrás: lo único que queda es el registro en la bitácora de auditoría.`}
                confirmar="Sí, vaciar la bandeja"
                accion={eliminarBandejaSolicitudes}
              />
            </MenuAcciones>
          ) : null
        }
      />

      <Tabla
        caption="Solicitudes de inscripción de beneficiarios recibidas desde el sitio público"
        columnas={COLUMNAS}
        className="tabla-acciones-fijas"
      >
        {solicitudes.length === 0 ? (
          <FilaVacia
            columnas={COLUMNAS.length}
            mensaje="No hay solicitudes sin atender. Las aceptadas continúan en Inscripciones."
          />
        ) : (
          solicitudes.map((solicitud) => (
            <Fila key={solicitud.id}>
              <Celda>
                <span className="font-medium">{solicitud.nombreNino}</span>
                {solicitud.diagnostico ? (
                  <span className="block text-xs text-ink-soft">
                    {solicitud.diagnostico}
                  </span>
                ) : null}
              </Celda>
              <Celda className="whitespace-nowrap">
                {calcularEdad(solicitud.fechaNacimiento)} años
                <span className="block text-xs text-ink-soft">
                  Nació el {formatFecha(solicitud.fechaNacimiento)}
                </span>
              </Celda>
              <Celda>
                {solicitud.municipio}
                <span className="block text-xs text-ink-soft">
                  {solicitud.departamento}
                </span>
              </Celda>
              <Celda>
                <span className="block">{solicitud.encargadoNombre}</span>
                <span className="block text-xs text-ink-soft">
                  {solicitud.encargadoParentesco} ·{" "}
                  {solicitud.encargadoTelefono}
                </span>
              </Celda>
              <Celda>{solicitud.programaSolicitado ?? "Sin preferencia"}</Celda>
              <Celda className="whitespace-nowrap">
                {formatFecha(solicitud.createdAt)}
              </Celda>
              <Celda>
                <ChipSolicitud estado={solicitud.estado} />
              </Celda>
              <Celda className="whitespace-nowrap">
                <div className="flex items-center justify-end gap-3">
                  <MenuAcciones
                    id={solicitud.id}
                    etiqueta={`Acciones de la solicitud de ${solicitud.nombreNino}`}
                    titulo={solicitud.nombreNino}
                  >
                    {puedeInscribir ? (
                      <OpcionConfirmada
                        menu={solicitud.id}
                        etiqueta="Aceptar e inscribir"
                        mensaje={`La solicitud de ${solicitud.nombreNino} sale de esta bandeja y pasa a Inscripciones para llenar su papeleta. El expediente todavía no se crea: nace al guardarla.`}
                        confirmar="Sí, aceptar e inscribir"
                        accion={aceptarSolicitudEntrante}
                      >
                        <input type="hidden" name="id" value={solicitud.id} />
                      </OpcionConfirmada>
                    ) : null}
                    <OpcionConfirmada
                      menu={solicitud.id}
                      tono="peligro"
                      etiqueta="Eliminar"
                      mensaje={`Se borra de la base la solicitud de ${solicitud.nombreNino}. No se puede recuperar: lo único que queda es el registro en la bitácora de auditoría.`}
                      confirmar="Sí, eliminar"
                      accion={eliminarSolicitud}
                    >
                      <input type="hidden" name="id" value={solicitud.id} />
                    </OpcionConfirmada>
                  </MenuAcciones>
                </div>
              </Celda>
            </Fila>
          ))
        )}
      </Tabla>
    </>
  );
}
