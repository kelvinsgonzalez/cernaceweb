import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Campo, Chip, EnlaceBoton, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import { FormularioAcceso } from "./formulario";
import { crearAccesoBeneficiario } from "@/app/admin/usuarios/acciones";

export const metadata: Metadata = { title: "Acceso de la familia" };

export const dynamic = "force-dynamic";

const QUE_VE = [
  "Sus datos generales, sus terapias y su próxima cita.",
  "El objetivo del tratamiento, sin las anotaciones internas del equipo.",
  "Los avances marcados como compartidos, con sus fotos.",
  "Los documentos marcados como compartidos.",
];

export default async function AccesoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermiso(PERMISOS.BENEFICIARIO_ACCESO);
  const administraCuentas = tienePermiso(actor, PERMISOS.USUARIOS_GESTIONAR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      encargado: { select: { nombre: true, email: true } },
      usuario: {
        select: { id: true, nombre: true, email: true, activo: true, ultimoAcceso: true },
      },
    },
  });

  if (!beneficiario) notFound();

  const cuenta = beneficiario.usuario;

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Acceso de la familia"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          cuenta ? (
            cuenta.activo ? (
              <Chip tono="ok">Cuenta activa</Chip>
            ) : (
              <Chip tono="bad">Cuenta desactivada</Chip>
            )
          ) : (
            <Chip tono="neutro">Sin cuenta</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta>
          <TarjetaCabecera
            titulo={cuenta ? "La cuenta ya existe" : "Crear el acceso"}
            descripcion="Una cuenta de solo lectura para que la familia siga el progreso desde su casa."
            icono={<KeyRound className="size-5" />}
          />
          <div className="p-5">
            {cuenta ? (
              <>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Campo etiqueta="A nombre de">{cuenta.nombre}</Campo>
                  <Campo etiqueta="Correo">{cuenta.email}</Campo>
                  <Campo etiqueta="Último acceso">
                    {formatFechaHora(cuenta.ultimoAcceso)}
                  </Campo>
                  <Campo etiqueta="Estado">
                    {cuenta.activo ? "Activa" : "Desactivada"}
                  </Campo>
                </dl>
                <p className="medida-lectura mt-5 text-sm text-ink-soft">
                  Para cambiarle la contraseña, desactivarla o volver a
                  activarla, se hace desde la ficha de la cuenta.
                </p>
                {administraCuentas ? (
                  <EnlaceBoton
                    href={`/admin/usuarios/${cuenta.id}`}
                    variante="contorno"
                    className="mt-4"
                  >
                    Ir a la cuenta
                  </EnlaceBoton>
                ) : (
                  <p className="medida-lectura mt-2 text-xs text-ink-soft">
                    Eso lo hace quien administra las cuentas.
                  </p>
                )}
              </>
            ) : (
              <FormularioAcceso
                accion={crearAccesoBeneficiario}
                beneficiarioId={beneficiario.id}
                nombreSugerido={beneficiario.encargado?.nombre ?? ""}
                emailSugerido={beneficiario.encargado?.email ?? ""}
              />
            )}
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera titulo="Qué verá la familia" />
          <ul className="space-y-3 p-5 text-sm text-ink-soft">
            {QUE_VE.map((punto) => (
              <li key={punto} className="medida-lectura">
                {punto}
              </li>
            ))}
          </ul>
          <p className="medida-lectura border-t border-line px-5 py-4 text-xs text-ink-soft">
            No verá el expediente clínico, la ficha socioeconómica, los avances
            internos ni los comentarios del equipo. Y no puede escribir nada: el
            rol solo trae el permiso de consulta.
          </p>
        </Tarjeta>
      </div>
    </>
  );
}
