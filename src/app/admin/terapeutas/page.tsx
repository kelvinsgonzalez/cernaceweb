import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import { FormularioNuevoTerapeuta } from "./formulario";
import { crearTerapeuta } from "./acciones";

export const metadata: Metadata = { title: "Terapeutas" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Terapeuta",
  "Especialidad",
  "Casos activos",
  "Último acceso",
  "Estado",
  "Acción",
];

export default async function TerapeutasPage() {
  await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const terapeutas = await prisma.user.findMany({
    where: { roles: { some: { role: { clave: ROLES.TERAPEUTA } } } },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      cargo: true,
      activo: true,
      ultimoAcceso: true,
      roles: { select: { role: { select: { clave: true } } } },
      _count: { select: { asignaciones: { where: { activo: true } } } },
    },
  });

  const activos = terapeutas.filter((t) => t.activo);
  const sinCasos = activos.filter((t) => t._count.asignaciones === 0);
  const casos = activos.reduce((suma, t) => suma + t._count.asignaciones, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Terapeutas"
        descripcion="El equipo que atiende a los niños. Aquí se dan de alta y de baja; a qué niño atiende cada quien se decide en Terapia."
        acciones={
          <Link
            href="/admin/terapia"
            className="inline-flex items-center text-sm font-semibold text-brand-dark hover:underline"
          >
            Ir a Terapia
          </Link>
        }
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Terapeutas activos" valor={activos.length} />
        <Kpi etiqueta="Casos atendidos" valor={casos} />
        <Kpi etiqueta="Sin casos asignados" valor={sinCasos.length} />
      </div>

      <Tarjeta className="mb-8">
        <TarjetaCabecera
          titulo="Dar de alta a un terapeuta"
          descripcion="La cuenta se crea con el rol de terapeuta y nada más: expediente clínico, avances y documentos de sus casos. No da acceso a la recaudación ni a las cuentas del centro."
          icono={<UserPlus className="size-5" />}
        />
        <div className="p-5">
          <FormularioNuevoTerapeuta accion={crearTerapeuta} />
        </div>
      </Tarjeta>

      <Tabla
        caption="Cuentas con el rol de terapeuta, sus casos activos y su estado"
        columnas={COLUMNAS}
      >
        {terapeutas.length === 0 ? (
          <FilaVacia
            columnas={COLUMNAS.length}
            mensaje="Todavía no hay terapeutas dados de alta."
          />
        ) : (
          terapeutas.map((terapeuta) => {
            // Una cuenta que además sea de dirección o administración no se
            // toca desde aquí: se administra en Usuarios y roles.
            const soloTerapeuta = terapeuta.roles.every(
              (r) => r.role.clave === ROLES.TERAPEUTA,
            );

            return (
              <Fila key={terapeuta.id}>
                <Celda>
                  <span className="font-medium">{terapeuta.nombre}</span>
                  <span className="block text-xs text-ink-soft">
                    {terapeuta.email}
                  </span>
                </Celda>
                <Celda>{terapeuta.cargo ?? "Terapeuta"}</Celda>
                <Celda className="whitespace-nowrap">
                  {terapeuta._count.asignaciones}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatFechaHora(terapeuta.ultimoAcceso)}
                </Celda>
                <Celda>
                  {terapeuta.activo ? (
                    <Chip tono="ok">Activo</Chip>
                  ) : (
                    <Chip tono="neutro">De baja</Chip>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {soloTerapeuta ? (
                    <Link
                      href={`/admin/terapeutas/${terapeuta.id}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  ) : (
                    <span className="text-xs text-ink-soft">
                      Tiene otros roles: se administra en Usuarios
                    </span>
                  )}
                </Celda>
              </Fila>
            );
          })
        )}
      </Tabla>
    </>
  );
}
