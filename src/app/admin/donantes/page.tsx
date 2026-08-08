import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Donantes y padrinos" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Padrino",
  "Contacto",
  "Apadrinados",
  "Aporte mensual",
  "Acceso al portal",
  "Desde",
];

export default async function DonantesPage() {
  await requirePermiso(PERMISOS.DONACIONES_LEER);

  const padrinos = await prisma.padrino.findMany({
    orderBy: { nombre: "asc" },
    include: {
      padrinazgos: {
        where: { activo: true },
        include: {
          beneficiario: { select: { id: true, nombres: true, apellidos: true } },
        },
      },
    },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Donantes y padrinos"
        descripcion="Personas y organizaciones que sostienen los programas con un aporte periódico."
      />

      <Tabla
        caption="Padrinos registrados con sus beneficiarios asignados y su aporte"
        columnas={COLUMNAS}
      >
        {padrinos.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay padrinos registrados." />
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
                <Celda className="whitespace-nowrap">
                  {formatFecha(padrino.createdAt)}
                </Celda>
              </Fila>
            );
          })
        )}
      </Tabla>
    </>
  );
}
