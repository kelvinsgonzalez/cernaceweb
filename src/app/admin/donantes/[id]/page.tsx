import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HeartHandshake, IdCard, KeyRound, Power } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Campo,
  Chip,
  EnlaceBoton,
  Tarjeta,
  TarjetaCabecera,
  Vacio,
} from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha, formatFechaHora, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import {
  BotonEstadoPadrino,
  FormularioAccesoPadrino,
  FormularioPadrino,
} from "../formulario";
import {
  actualizarPadrino,
  cambiarEstadoPadrino,
  crearAccesoPadrino,
} from "../acciones";

export const metadata: Metadata = { title: "Ficha del padrino" };

export const dynamic = "force-dynamic";

export default async function PadrinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermiso(PERMISOS.PADRINOS_GESTIONAR);
  const administraCuentas = tienePermiso(actor, PERMISOS.USUARIOS_GESTIONAR);
  const asigna = tienePermiso(actor, PERMISOS.PADRINAZGOS_GESTIONAR);

  const padrino = await prisma.padrino.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, activo: true, ultimoAcceso: true },
      },
      padrinazgos: {
        orderBy: [{ activo: "desc" }, { fechaInicio: "desc" }],
        include: {
          beneficiario: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              codigoExpediente: true,
            },
          },
        },
      },
    },
  });

  if (!padrino) notFound();

  const vivos = padrino.padrinazgos.filter((p) => p.activo);
  const aporte = vivos.reduce((suma, p) => suma + aNumero(p.aporteMensual), 0);

  return (
    <>
      <Link
        href="/admin/donantes"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a donantes y padrinos
      </Link>

      <EncabezadoPagina
        titulo={padrino.nombre}
        descripcion={`${padrino.email} · aporta ${formatQuetzales(aporte)} al mes`}
        acciones={
          <>
            {padrino.activo ? (
              <Chip tono="ok">Ficha activa</Chip>
            ) : (
              <Chip tono="neutro">Ficha de baja</Chip>
            )}
            {padrino.user ? (
              <Chip tono="ok">Con acceso al portal</Chip>
            ) : (
              <Chip tono="warn">Sin acceso al portal</Chip>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Datos de la ficha"
              descripcion="Los datos de contacto con los que se le busca y con los que se emite su recibo."
              icono={<IdCard className="size-5" />}
            />
            <div className="p-5">
              <FormularioPadrino
                accion={actualizarPadrino}
                correoBloqueado={Boolean(padrino.userId)}
                valores={{
                  id: padrino.id,
                  nombre: padrino.nombre,
                  email: padrino.email,
                  telefono: padrino.telefono ?? "",
                  direccion: padrino.direccion ?? "",
                  ocupacion: padrino.ocupacion ?? "",
                  nit: padrino.nit ?? "",
                }}
              />
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Apadrinamientos"
              descripcion="Los vigentes y los que ya se dieron por terminados."
              icono={<HeartHandshake className="size-5" />}
              acciones={
                asigna ? (
                  <EnlaceBoton href="/admin/asignaciones" variante="contorno">
                    Asignar
                  </EnlaceBoton>
                ) : undefined
              }
            />
            {padrino.padrinazgos.length === 0 ? (
              <div className="p-5">
                <Vacio mensaje="Todavía no apadrina a nadie. En Asignaciones se le vincula con un beneficiario que esté esperando padrino." />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {padrino.padrinazgos.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <Link
                        href={`/admin/beneficiarios/${p.beneficiario.id}`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {p.beneficiario.nombres} {p.beneficiario.apellidos}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {p.beneficiario.codigoExpediente} · desde{" "}
                        {formatFecha(p.fechaInicio)}
                        {p.fechaFin ? ` hasta ${formatFecha(p.fechaFin)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">
                        {formatQuetzales(aNumero(p.aporteMensual))}
                      </span>
                      {p.activo ? (
                        <Chip tono="ok">Vigente</Chip>
                      ) : (
                        <Chip tono="neutro">Terminado</Chip>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Acceso al portal"
              descripcion="Con esta cuenta ve el progreso de quien apadrina."
              icono={<KeyRound className="size-5" />}
            />
            <div className="p-5">
              {padrino.user ? (
                <>
                  <dl className="grid gap-5">
                    <Campo etiqueta="Correo">{padrino.user.email}</Campo>
                    <Campo etiqueta="Último acceso">
                      {formatFechaHora(padrino.user.ultimoAcceso)}
                    </Campo>
                    <Campo etiqueta="Estado">
                      {padrino.user.activo ? "Activa" : "Desactivada"}
                    </Campo>
                  </dl>
                  {administraCuentas ? (
                    <EnlaceBoton
                      href={`/admin/usuarios/${padrino.user.id}`}
                      variante="contorno"
                      className="mt-5"
                    >
                      Ir a la cuenta
                    </EnlaceBoton>
                  ) : (
                    <p className="medida-lectura mt-5 text-xs text-ink-soft">
                      Para cambiarle la contraseña o desactivarla, lo hace quien
                      administra las cuentas.
                    </p>
                  )}
                </>
              ) : (
                <FormularioAccesoPadrino
                  accion={crearAccesoPadrino}
                  padrinoId={padrino.id}
                  email={padrino.email}
                />
              )}
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Estado de la ficha"
              descripcion="Una ficha de baja no aparece al asignar. No se borra nada: los apadrinamientos y las donaciones quedan en el historial."
              icono={<Power className="size-5" />}
            />
            <div className="p-5">
              {padrino.activo && vivos.length > 0 ? (
                <p className="medida-lectura mb-4 text-sm text-ink-soft">
                  Tiene {vivos.length}{" "}
                  {vivos.length === 1 ? "apadrinamiento" : "apadrinamientos"} en
                  marcha. Hay que darlos por terminados en Asignaciones antes de
                  darlo de baja.
                </p>
              ) : null}
              <BotonEstadoPadrino
                accion={cambiarEstadoPadrino}
                id={padrino.id}
                activo={padrino.activo}
              />
            </div>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
