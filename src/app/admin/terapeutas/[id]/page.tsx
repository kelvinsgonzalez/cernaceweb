import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, IdCard, KeyRound, Power, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { Campo, Chip, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFecha, formatFechaHora } from "@/lib/fechas";
import {
  BotonEstadoTerapeuta,
  FormularioContrasenaTerapeuta,
  FormularioEditarTerapeuta,
} from "../formulario";
import {
  actualizarTerapeuta,
  cambiarEstadoTerapeuta,
  restablecerContrasenaTerapeuta,
} from "../acciones";

export const metadata: Metadata = { title: "Ficha del terapeuta" };

export const dynamic = "force-dynamic";

export default async function TerapeutaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.TERAPEUTAS_GESTIONAR);

  const terapeuta = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      cargo: true,
      activo: true,
      ultimoAcceso: true,
      createdAt: true,
      roles: { select: { role: { select: { clave: true } } } },
      _count: { select: { avancesRegistrados: true } },
      asignaciones: {
        orderBy: [{ activo: "desc" }, { desde: "desc" }],
        select: {
          id: true,
          activo: true,
          desde: true,
          hasta: true,
          area: true,
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

  if (!terapeuta) notFound();

  // Misma regla que en el servidor: esta sección solo alcanza a las cuentas
  // que son de terapeuta y de nada más.
  const claves = terapeuta.roles.map((r) => r.role.clave);
  if (!claves.every((c) => c === ROLES.TERAPEUTA) || claves.length === 0) {
    notFound();
  }

  const vivas = terapeuta.asignaciones.filter((a) => a.activo);

  return (
    <>
      <Link
        href="/admin/terapeutas"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a terapeutas
      </Link>

      <EncabezadoPagina
        titulo={terapeuta.nombre}
        descripcion={`${terapeuta.email} · ${terapeuta.cargo ?? "Terapeuta"}`}
        acciones={
          terapeuta.activo ? (
            <Chip tono="ok">Cuenta activa</Chip>
          ) : (
            <Chip tono="neutro">Cuenta de baja</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Datos de la cuenta"
              descripcion="El correo no se cambia desde aquí: es con el que inicia sesión."
              icono={<IdCard className="size-5" />}
            />
            <div className="p-5">
              <FormularioEditarTerapeuta
                accion={actualizarTerapeuta}
                id={terapeuta.id}
                nombre={terapeuta.nombre}
                cargo={terapeuta.cargo}
              />
              <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
                <Campo etiqueta="Correo">{terapeuta.email}</Campo>
                <Campo etiqueta="Alta">{formatFecha(terapeuta.createdAt)}</Campo>
                <Campo etiqueta="Último acceso">
                  {formatFechaHora(terapeuta.ultimoAcceso)}
                </Campo>
              </dl>
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Casos que lleva"
              descripcion="Quién atiende a cada niño se decide en Terapia. Al dar de baja la cuenta, los casos vivos se cierran con la fecha del día."
              icono={<Users className="size-5" />}
            />
            {terapeuta.asignaciones.length === 0 ? (
              <Vacio mensaje="Todavía no tiene casos asignados. Se le asignan desde Terapia." />
            ) : (
              <ul className="divide-y divide-line">
                {terapeuta.asignaciones.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <Link
                        href={`/admin/beneficiarios/${a.beneficiario.id}`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {a.beneficiario.nombres} {a.beneficiario.apellidos}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {a.beneficiario.codigoExpediente}
                        {a.area ? ` · ${a.area}` : ""} · desde{" "}
                        {formatFecha(a.desde)}
                        {a.hasta ? ` hasta ${formatFecha(a.hasta)}` : ""}
                      </p>
                    </div>
                    {a.activo ? (
                      <Chip tono="ok">Vigente</Chip>
                    ) : (
                      <Chip tono="neutro">Cerrado</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="En resumen"
              nivel={3}
            />
            <dl className="grid gap-5 p-5">
              <Campo etiqueta="Casos vigentes">{vivas.length}</Campo>
              <Campo etiqueta="Avances registrados">
                {terapeuta._count.avancesRegistrados}
              </Campo>
            </dl>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Contraseña"
              descripcion="La plataforma no envía correos: comunícasela por un medio seguro."
              icono={<KeyRound className="size-5" />}
            />
            <div className="p-5">
              <FormularioContrasenaTerapeuta
                accion={restablecerContrasenaTerapeuta}
                id={terapeuta.id}
              />
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Estado de la cuenta"
              descripcion="Dar de baja impide iniciar sesión y cierra los casos que llevaba. No se borra nada: sus avances y documentos quedan en el expediente."
              icono={<Power className="size-5" />}
            />
            <div className="p-5">
              {terapeuta.activo && vivas.length > 0 ? (
                <p className="medida-lectura mb-4 text-sm text-ink-soft">
                  Lleva {vivas.length}{" "}
                  {vivas.length === 1 ? "caso" : "casos"}. Al darlo de baja
                  habrá que reasignar{" "}
                  {vivas.length === 1 ? "ese niño" : "esos niños"} desde Terapia.
                </p>
              ) : null}
              <BotonEstadoTerapeuta
                accion={cambiarEstadoTerapeuta}
                id={terapeuta.id}
                activo={terapeuta.activo}
              />
            </div>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
