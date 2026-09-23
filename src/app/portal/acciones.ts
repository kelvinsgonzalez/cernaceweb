"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { METODO_DEPOSITO, generarReferencia } from "@/lib/pasarela";
import { guardarBoleta, validarBoleta } from "@/lib/almacenamiento";
import {
  erroresDeZod,
  esquemaAportePadrino,
  type EstadoFormulario,
} from "@/lib/formularios";
import { primerNombre } from "@/lib/utils";

/**
 * El aporte de un padrino a su ahijado desde la ficha del niño. El padrino no
 * escribe ni su nombre, ni el código, ni el monto, ni el mes: solo sube la
 * foto del comprobante y, si quiere, un mensaje de amor. Todo lo demás lo
 * pone el servidor a partir de la sesión y del compromiso vigente.
 *
 * Nace PENDIENTE y sin monto. El administrador anota el monto al aprobar y
 * decide si el mensaje llega a la familia.
 */
export async function enviarAporte(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  const parseo = esquemaAportePadrino.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return {
      error: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  const entrante = datos.get("boleta");
  if (!(entrante instanceof File) || entrante.size === 0) {
    return {
      error: "Falta la foto del comprobante.",
      errores: { boleta: "Elige la foto o el PDF de tu comprobante." },
    };
  }
  const problema = validarBoleta(entrante);
  if (problema) {
    return { error: "Revisa el archivo.", errores: { boleta: problema } };
  }

  // El compromiso tiene que ser de este padrino: un id ajeno no devuelve nada.
  const compromiso = usuario.padrinoId
    ? await prisma.padrinazgo.findFirst({
        where: {
          padrinoId: usuario.padrinoId,
          beneficiarioId: parseo.data.beneficiarioId,
          activo: true,
        },
        select: {
          id: true,
          padrino: { select: { id: true, nombre: true, email: true } },
          beneficiario: { select: { id: true, nombres: true, codigoExpediente: true } },
        },
      })
    : null;
  if (!compromiso) {
    return { error: "Ese beneficiario no está asignado a tu cuenta." };
  }

  const guardado = await guardarBoleta(entrante);

  const donacion = await prisma.donacion.create({
    data: {
      tipo: "APADRINAMIENTO",
      padrinoId: compromiso.padrino.id,
      beneficiarioId: compromiso.beneficiario.id,
      padrinazgoId: compromiso.id,
      usuarioId: usuario.id,
      donanteNombre: compromiso.padrino.nombre,
      donanteEmail: compromiso.padrino.email,
      metodo: METODO_DEPOSITO,
      estado: "PENDIENTE",
      referenciaPasarela: generarReferencia(),
      mensaje: parseo.data.mensaje || null,
      boletaArchivo: guardado.archivo,
      boletaTipoMime: guardado.tipoMime,
      boletaTamanoBytes: guardado.tamanoBytes,
      boletaSubidaEn: new Date(),
    },
    select: { id: true, referenciaPasarela: true },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "CREAR",
    entidad: "Donacion",
    entidadId: donacion.id,
    detalle: `Aporte de ${compromiso.padrino.nombre} a ${primerNombre(compromiso.beneficiario.nombres)} (${compromiso.beneficiario.codigoExpediente}) desde el portal · referencia ${donacion.referenciaPasarela}${parseo.data.mensaje ? " · con mensaje de amor" : ""}`,
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/${compromiso.beneficiario.id}`);
  revalidatePath("/portal/aportes");
  revalidatePath("/admin/donaciones");
  revalidatePath("/admin");

  redirect(`/portal/aportes?enviado=${donacion.referenciaPasarela}`);
}
