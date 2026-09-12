"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";

/**
 * Una transferencia o un depósito no los aprueba la pasarela: los aprueba
 * quien coteja la boleta contra el estado de cuenta. Hasta entonces la
 * donación sigue PENDIENTE y no suma en el total recaudado.
 */

function refrescar(id: string) {
  revalidatePath("/admin/donaciones");
  revalidatePath(`/admin/donaciones/${id}`);
  revalidatePath("/admin");
}

export async function verificarDonacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  const aprobar = String(datos.get("decision") ?? "") === "APROBAR";
  // La nota es opcional, pero al rechazar es lo que el donante verá en su
  // comprobante, así que se guarda tal cual la escribió el equipo.
  const nota = String(datos.get("notaVerificacion") ?? "")
    .trim()
    .slice(0, 500);

  if (!id) return;

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      monto: true,
      referenciaPasarela: true,
      donanteNombre: true,
    },
  });
  if (!donacion) redirect("/admin/donaciones");
  if (donacion.estado !== "PENDIENTE") redirect(`/admin/donaciones/${id}`);

  // Un donativo depositado en el banco llega sin monto: quien deposita no lo
  // declara. Aprobarlo sin anotarlo lo haría sumar cero al total recaudado, así
  // que se pide aquí. Al rechazar no hace falta: el aporte no suma.
  let monto = donacion.monto;
  if (aprobar && monto === null) {
    const escrito = Number(String(datos.get("monto") ?? "").trim());
    if (!Number.isFinite(escrito) || escrito <= 0) {
      redirect(`/admin/donaciones/${id}?falta=monto`);
    }
    monto = new Prisma.Decimal(escrito.toFixed(2));
  }

  await prisma.donacion.update({
    where: { id },
    data: {
      estado: aprobar ? "COMPLETADA" : "FALLIDA",
      monto,
      verificadaPor: usuario.nombre,
      verificadaEn: new Date(),
      notaVerificacion: nota || null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: aprobar ? "PAGO_APROBADO" : "PAGO_RECHAZADO",
    entidad: "Donacion",
    entidadId: id,
    detalle: `Donación de ${donacion.donanteNombre ?? "donante sin identificar"} por ${formatQuetzales(aNumero(monto))} ${aprobar ? "verificada" : "rechazada"} · referencia ${donacion.referenciaPasarela}${nota ? ` · ${nota}` : ""}`,
  });

  refrescar(id);
  redirect(`/admin/donaciones/${id}`);
}

/**
 * Deshacer la verificación: devuelve la donación a pendiente para que se
 * revise otra vez. Un clic de más no debe dejar un aporte real marcado como
 * fallido sin salida.
 */
export async function reabrirDonacion(datos: FormData) {
  const usuario = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const donacion = await prisma.donacion.findUnique({
    where: { id },
    select: { id: true, estado: true, referenciaPasarela: true },
  });
  if (!donacion) redirect("/admin/donaciones");
  if (donacion.estado === "PENDIENTE") redirect(`/admin/donaciones/${id}`);

  await prisma.donacion.update({
    where: { id },
    data: {
      estado: "PENDIENTE",
      verificadaPor: null,
      verificadaEn: null,
      notaVerificacion: null,
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "ACTUALIZAR",
    entidad: "Donacion",
    entidadId: id,
    detalle: `Donación devuelta a pendiente para revisarla de nuevo · referencia ${donacion.referenciaPasarela}`,
  });

  refrescar(id);
  redirect(`/admin/donaciones/${id}`);
}
