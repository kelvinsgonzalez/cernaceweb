import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { calcularEdad, fechaParaInput, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero, primerNombre } from "@/lib/utils";
import { FormularioAsignacion } from "./formulario";
import { asignarPadrinazgo, finalizarPadrinazgo } from "./acciones";

export const metadata: Metadata = { title: "Asignaciones" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Beneficiario",
  "Programa",
  "Padrino",
  "Aporte",
  "Modalidad",
  "Desde",
  "Acción",
];

export default async function AsignacionesPage() {
  await requirePermiso(PERMISOS.PADRINAZGOS_GESTIONAR);

  const [activos, sinPadrino, padrinos, ajuste] = await Promise.all([
    prisma.padrinazgo.findMany({
      where: { activo: true },
      include: {
        padrino: { select: { nombre: true, email: true, userId: true } },
        beneficiario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoExpediente: true,
            programa: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaInicio: "desc" },
    }),
    prisma.beneficiario.findMany({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
        fechaNacimiento: true,
        solicitaPatrocinio: true,
        publicadoEnGaleria: true,
        programa: { select: { nombre: true } },
      },
      orderBy: { fechaIngreso: "asc" },
    }),
    prisma.padrino.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        userId: true,
        _count: { select: { padrinazgos: { where: { activo: true } } } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.setting.findUnique({ where: { clave: "donaciones.aporteSugerido" } }),
  ]);

  // Quienes pidieron patrocinador y todavía no se han publicado: sin la
  // autorización nadie los ve, así que nunca les llegará un padrino.
  const esperandoAutorizacion = sinPadrino.filter(
    (b) => b.solicitaPatrocinio && !b.publicadoEnGaleria,
  );

  const sinAsignacion = padrinos.filter((p) => p._count.padrinazgos === 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Asignaciones"
        descripcion="Vincula a un beneficiario con la cuenta de un padrino. En cuanto se asigna, el beneficiario sale de la galería pública y aparece en el portal de su padrino."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Apadrinamientos activos" valor={activos.length} />
        <Kpi etiqueta="Esperan padrino" valor={sinPadrino.length} />
        <Kpi etiqueta="Padrinos sin asignación" valor={sinAsignacion.length} />
      </div>

      {esperandoAutorizacion.length > 0 ? (
        <Tarjeta className="mt-8">
          <TarjetaCabecera
            titulo="Piden patrocinador y no están publicados"
            descripcion="La familia lo pidió pero falta la autorización de la administración, así que no aparecen en la página pública y nadie puede ofrecerse a apadrinarlos."
          />
          <ul className="divide-y divide-line">
            {esperandoAutorizacion.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <Link
                    href={`/admin/beneficiarios/${b.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {primerNombre(b.nombres)} {b.apellidos}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    {b.codigoExpediente} · {calcularEdad(b.fechaNacimiento)} años ·{" "}
                    {b.programa.nombre}
                  </span>
                </div>
                <Chip tono="warn">Falta autorizar</Chip>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}

      <Tarjeta className="mt-8">
        <TarjetaCabecera
          titulo="Nueva asignación"
          descripcion="Solo aparecen beneficiarios activos que no tengan ya un padrino."
        />
        <div className="p-5">
          <FormularioAsignacion
            accion={asignarPadrinazgo}
            aporteSugerido={ajuste?.valor ?? "350"}
            hoy={fechaParaInput(new Date())}
            beneficiarios={sinPadrino.map((b) => ({
              id: b.id,
              etiqueta: `${b.nombres} ${b.apellidos} · ${calcularEdad(b.fechaNacimiento)} años · ${b.programa.nombre}`,
            }))}
            padrinos={padrinos.map((p) => ({
              id: p.id,
              etiqueta: `${p.nombre} · ${p.email}${p.userId ? "" : " (sin acceso al portal)"}`,
            }))}
          />
        </div>
      </Tarjeta>

      <div className="mt-8">
        <h2 className="mb-4 font-heading text-xl font-semibold text-ink">
          Apadrinamientos activos
        </h2>
        <Tabla
          caption="Beneficiarios con un padrino asignado actualmente"
          columnas={COLUMNAS}
        >
          {activos.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="Todavía no hay ningún beneficiario asignado."
            />
          ) : (
            activos.map((padrinazgo) => (
              <Fila key={padrinazgo.id}>
                <Celda>
                  <Link
                    href={`/admin/beneficiarios/${padrinazgo.beneficiario.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {primerNombre(padrinazgo.beneficiario.nombres)}{" "}
                    {padrinazgo.beneficiario.apellidos}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    {padrinazgo.beneficiario.codigoExpediente}
                  </span>
                </Celda>
                <Celda>{padrinazgo.beneficiario.programa.nombre}</Celda>
                <Celda>
                  <span className="block">{padrinazgo.padrino.nombre}</span>
                  <span className="block text-xs text-ink-soft">
                    {padrinazgo.padrino.email}
                  </span>
                  {padrinazgo.padrino.userId ? null : (
                    <Chip tono="warn" className="mt-1">
                      Sin acceso al portal
                    </Chip>
                  )}
                </Celda>
                <Celda className="whitespace-nowrap">
                  {formatQuetzales(aNumero(padrinazgo.aporteMensual))}
                </Celda>
                <Celda>{padrinazgo.modalidad.toLowerCase()}</Celda>
                <Celda className="whitespace-nowrap">
                  {formatFecha(padrinazgo.fechaInicio)}
                </Celda>
                <Celda>
                  <form action={finalizarPadrinazgo}>
                    <input type="hidden" name="id" value={padrinazgo.id} />
                    <Boton type="submit" variante="contorno" className="px-3 py-1.5 text-xs">
                      Finalizar
                      <span className="visually-hidden">
                        el apadrinamiento de{" "}
                        {primerNombre(padrinazgo.beneficiario.nombres)} por{" "}
                        {padrinazgo.padrino.nombre}
                      </span>
                    </Boton>
                  </form>
                </Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </div>
    </>
  );
}
