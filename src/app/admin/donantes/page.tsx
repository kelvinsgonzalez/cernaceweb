import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAlgunPermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { FormularioPadrino } from "./formulario";
import { crearPadrino } from "./acciones";

export const metadata: Metadata = { title: "Donantes y padrinos" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Padrino",
  "Contacto",
  "Apadrinados",
  "Aporte mensual",
  "Acceso al portal",
  "Estado",
  "Desde",
];

export default async function DonantesPage() {
  const usuario = await requireAlgunPermiso([
    PERMISOS.DONACIONES_LEER,
    PERMISOS.PADRINOS_GESTIONAR,
  ]);
  const gestiona = tienePermiso(usuario, PERMISOS.PADRINOS_GESTIONAR);

  const padrinos = await prisma.padrino.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: {
      padrinazgos: {
        where: { activo: true },
        include: {
          beneficiario: { select: { id: true, nombres: true, apellidos: true } },
        },
      },
    },
  });

  const activos = padrinos.filter((p) => p.activo);
  const sinAsignar = activos.filter((p) => p.padrinazgos.length === 0);
  const sinCuenta = activos.filter((p) => !p.userId);

  const columnas = gestiona ? [...COLUMNAS, "Acción"] : COLUMNAS;

  return (
    <>
      <EncabezadoPagina
        titulo="Donantes y padrinos"
        descripcion="Personas y organizaciones que sostienen los programas con un aporte periódico. Aquí se lleva su ficha; a quién apadrinan se decide en Asignaciones."
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Padrinos activos" valor={activos.length} />
        <Kpi etiqueta="Sin beneficiario asignado" valor={sinAsignar.length} />
        <Kpi etiqueta="Sin acceso al portal" valor={sinCuenta.length} />
      </div>

      {gestiona ? (
        <Tarjeta className="mb-8">
          <TarjetaCabecera
            titulo="Registrar un padrino"
            descripcion="La ficha basta para poder asignarle un beneficiario. El acceso al portal se le da después, desde su ficha."
            icono={<UserPlus className="size-5" />}
          />
          <div className="p-5">
            <FormularioPadrino accion={crearPadrino} />
          </div>
        </Tarjeta>
      ) : null}

      <Tabla
        caption="Padrinos registrados con sus beneficiarios asignados y su aporte"
        columnas={columnas}
      >
        {padrinos.length === 0 ? (
          <FilaVacia columnas={columnas.length} mensaje="No hay padrinos registrados." />
        ) : (
          padrinos.map((padrino) => {
            const aporte = padrino.padrinazgos.reduce(
              (suma, p) => suma + aNumero(p.aporteMensual),
              0,
            );
            return (
              <Fila key={padrino.id}>
                <Celda>
                  <span className="font-medium">{padrino.nombre}</span>
                  {padrino.ocupacion ? (
                    <span className="block text-xs text-ink-soft">
                      {padrino.ocupacion}
                    </span>
                  ) : null}
                </Celda>
                <Celda>
                  <span className="block">{padrino.email}</span>
                  {padrino.telefono ? (
                    <span className="block text-xs text-ink-soft">
                      {padrino.telefono}
                    </span>
                  ) : null}
                </Celda>
                <Celda>
                  {padrino.padrinazgos.length === 0 ? (
                    <span className="text-ink-soft">Sin asignar</span>
                  ) : (
                    <ul className="space-y-1">
                      {padrino.padrinazgos.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/admin/beneficiarios/${p.beneficiario.id}`}
                            className="text-brand-primary hover:underline"
                          >
                            {p.beneficiario.nombres} {p.beneficiario.apellidos}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">{formatQuetzales(aporte)}</Celda>
                <Celda>
                  {padrino.userId ? (
                    <Chip tono="ok">Con cuenta</Chip>
                  ) : (
                    <Chip tono="warn">Sin cuenta</Chip>
                  )}
                </Celda>
                <Celda>
                  {padrino.activo ? (
                    <Chip tono="ok">Activo</Chip>
                  ) : (
                    <Chip tono="neutro">De baja</Chip>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatFecha(padrino.createdAt)}
                </Celda>
                {gestiona ? (
                  <Celda className="whitespace-nowrap">
                    <Link
                      href={`/admin/donantes/${padrino.id}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  </Celda>
                ) : null}
              </Fila>
            );
          })
        )}
      </Tabla>
    </>
  );
}
