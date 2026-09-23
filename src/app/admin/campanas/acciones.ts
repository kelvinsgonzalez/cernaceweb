"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { fechaDesdeInput } from "@/lib/fechas";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { slugify } from "@/lib/utils";
import {
  MAXIMO_PALABRA,
  MAXIMO_RESUMEN,
  MAXIMO_TITULO,
  sinPalabrasLargas,
} from "@/lib/campanas";
import {
  borrarFotoCampana,
  guardarFotoCampana,
  validarImagen,
} from "@/lib/almacenamiento";

/**
 * Campañas: las crea, edita y cierra solo el administrador. Cada una lleva
 * fecha límite, monto esperado, fotos y descripción corta. Lo recaudado no se
 * escribe: es la suma de sus aportes aprobados. Cerrada, desaparece de la
 * portada y ya no admite aportes; queda en el informe y las métricas.
 */

const MAXIMO_FOTOS = 6;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha.");

const campos = {
  titulo: z
    .string()
    .trim()
    .min(6, "Escribe un título que diga de qué va la campaña.")
    .max(MAXIMO_TITULO, `El título no puede pasar de ${MAXIMO_TITULO} caracteres.`)
    .refine(sinPalabrasLargas, {
      message: `Ninguna palabra puede pasar de ${MAXIMO_PALABRA} letras: no cabría en la tarjeta.`,
    }),
  resumen: z
    .string()
    .trim()
    .min(20, "La descripción corta necesita al menos 20 caracteres.")
    .max(MAXIMO_RESUMEN, `La descripción corta no puede pasar de ${MAXIMO_RESUMEN} caracteres.`)
    .refine(sinPalabrasLargas, {
      message: `Ninguna palabra puede pasar de ${MAXIMO_PALABRA} letras: no cabría en la tarjeta.`,
    }),
  descripcion: z
    .string()
    .trim()
    .max(2000, "La descripción es demasiado larga.")
    .optional(),
  meta: z
    .string()
    .trim()
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Escribe el monto esperado en quetzales.",
    }),
  fechaInicio: fecha,
  fechaFin: fecha.refine(() => true, "Selecciona la fecha límite."),
};

const esquemaNueva = z
  .object(campos)
  .refine((v) => v.fechaFin >= v.fechaInicio, {
    message: "La fecha límite tiene que ser igual o posterior al inicio.",
    path: ["fechaFin"],
  });
const esquemaEdicion = z
  .object({ ...campos, id: z.string().min(1) })
  .refine((v) => v.fechaFin >= v.fechaInicio, {
    message: "La fecha límite tiene que ser igual o posterior al inicio.",
    path: ["fechaFin"],
  });

function refrescar(id?: string) {
  revalidatePath("/admin/campanas");
  if (id) {
    revalidatePath(`/admin/campanas/${id}`);
    revalidatePath(`/admin/campanas/${id}/metricas`);
  }
  revalidatePath("/");
  revalidatePath("/donar");
  revalidatePath("/portal");
  revalidatePath("/mi-expediente");
}

/** El slug se decide una sola vez, al crear: es el enlace público de la campaña. */
async function slugLibre(titulo: string): Promise<string> {
  const base = slugify(titulo) || "campana";
  for (let intento = 0; ; intento += 1) {
    const candidato = intento === 0 ? base : `${base}-${intento + 1}`;
    const ocupado = await prisma.campaign.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!ocupado) return candidato;
  }
}

/** Las fotos del formulario, ya validadas; un error corta todo el envío. */
function fotosDe(datos: FormData): { fotos: File[]; error?: string } {
  const fotos = datos
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length > MAXIMO_FOTOS) {
    return { fotos: [], error: `Como mucho ${MAXIMO_FOTOS} fotos por envío.` };
  }
  for (const foto of fotos) {
    const problema = validarImagen(foto);
    if (problema) return { fotos: [], error: problema };
  }
  return { fotos };
}

async function guardarFotos(campaignId: string, fotos: File[], desde: number) {
  for (const [i, foto] of fotos.entries()) {
    const guardada = await guardarFotoCampana(foto);
    await prisma.campaignFoto.create({
      data: {
        campaignId,
        archivo: guardada.archivo,
        tipoMime: guardada.tipoMime,
        orden: desde + i,
      },
    });
  }
}

export async function crearCampana(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const parseo = esquemaNueva.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return { error: "Revisa los campos marcados.", errores: erroresDeZod(parseo.error) };
  }
  const { fotos, error } = fotosDe(datos);
  if (error) return { error: "Revisa las fotos.", errores: { fotos: error } };

  const v = parseo.data;
  const campana = await prisma.campaign.create({
    data: {
      titulo: v.titulo,
      slug: await slugLibre(v.titulo),
      resumen: v.resumen,
      descripcion: v.descripcion || v.resumen,
      meta: Number(v.meta).toFixed(2),
      fechaInicio: fechaDesdeInput(v.fechaInicio),
      fechaFin: fechaDesdeInput(v.fechaFin),
      activa: true,
    },
    select: { id: true },
  });
  await guardarFotos(campana.id, fotos, 0);

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "Campaign",
    entidadId: campana.id,
    detalle: `Campaña «${v.titulo}» creada con meta Q${v.meta} y fecha límite ${v.fechaFin}`,
  });

  refrescar(campana.id);
  redirect(`/admin/campanas/${campana.id}`);
}

export async function actualizarCampana(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const parseo = esquemaEdicion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return { error: "Revisa los campos marcados.", errores: erroresDeZod(parseo.error) };
  }
  const { fotos, error } = fotosDe(datos);
  if (error) return { error: "Revisa las fotos.", errores: { fotos: error } };

  const v = parseo.data;
  const campana = await prisma.campaign.findUnique({
    where: { id: v.id },
    select: { id: true, general: true, eliminadaEn: true, _count: { select: { fotos: true } } },
  });
  if (!campana || campana.eliminadaEn) return { error: "Esa campaña ya no existe." };

  await prisma.campaign.update({
    where: { id: campana.id },
    data: {
      titulo: v.titulo,
      // El slug no cambia al editar: es la parte del enlace que ya se
      // compartió en redes, y cambiarlo rompería lo que la gente guardó.
      resumen: v.resumen,
      descripcion: v.descripcion || v.resumen,
      // La general no tiene meta ni fecha límite.
      ...(campana.general
        ? {}
        : {
            meta: Number(v.meta).toFixed(2),
            fechaInicio: fechaDesdeInput(v.fechaInicio),
            fechaFin: fechaDesdeInput(v.fechaFin),
          }),
    },
  });
  await guardarFotos(campana.id, fotos, campana._count.fotos);

  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "Campaign",
    entidadId: campana.id,
    detalle: `Campaña «${v.titulo}» actualizada${fotos.length ? ` · ${fotos.length} foto(s) nueva(s)` : ""}`,
  });

  refrescar(campana.id);
  return { ok: "Cambios guardados." };
}

/** Cerrar o reabrir. La general no se cierra. */
export async function alternarCampana(datos: FormData) {
  const actor = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const campana = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, titulo: true, activa: true, general: true, eliminadaEn: true },
  });
  if (!campana || campana.general || campana.eliminadaEn) return;

  await prisma.campaign.update({
    where: { id },
    data: { activa: !campana.activa },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: campana.activa ? "DESACTIVAR" : "ACTIVAR",
    entidad: "Campaign",
    entidadId: id,
    detalle: `Campaña «${campana.titulo}» ${campana.activa ? "cerrada" : "reabierta"}`,
  });

  refrescar(id);
}

/**
 * Eliminar una campaña. Se van sus fotos (filas y archivos) y deja de existir
 * para el panel y la portada; la fila se queda marcada para que los informes
 * y las recaudaciones sigan mostrando su nombre y sus montos. La general no
 * se elimina.
 */
export async function eliminarCampana(datos: FormData) {
  const actor = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const campana = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      general: true,
      eliminadaEn: true,
      fotos: { select: { archivo: true } },
      _count: { select: { donaciones: true } },
    },
  });
  if (!campana || campana.general || campana.eliminadaEn) return;

  // Primero la base: si algo falla no queda una campaña «a medias». Los
  // archivos se borran después; uno que sobreviva no rompe nada.
  await prisma.$transaction([
    prisma.campaignFoto.deleteMany({ where: { campaignId: id } }),
    prisma.campaign.update({
      where: { id },
      data: { activa: false, eliminadaEn: new Date() },
    }),
  ]);
  await Promise.all(campana.fotos.map((f) => borrarFotoCampana(f.archivo)));

  await registrarAuditoria({
    actor: actor.email,
    accion: "ELIMINAR",
    entidad: "Campaign",
    entidadId: id,
    detalle: `Campaña «${campana.titulo}» eliminada · ${campana.fotos.length} foto(s) borrada(s) · ${campana._count.donaciones} aporte(s) conservados en los informes`,
  });

  refrescar(id);
  redirect("/admin/campanas");
}

export async function borrarFoto(datos: FormData) {
  const actor = await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const foto = await prisma.campaignFoto.findUnique({
    where: { id },
    select: { id: true, archivo: true, campaignId: true, campaign: { select: { titulo: true } } },
  });
  if (!foto) return;

  await prisma.campaignFoto.delete({ where: { id } });
  await borrarFotoCampana(foto.archivo);

  await registrarAuditoria({
    actor: actor.email,
    accion: "ELIMINAR",
    entidad: "CampaignFoto",
    entidadId: id,
    detalle: `Foto retirada de la campaña «${foto.campaign.titulo}»`,
  });

  refrescar(foto.campaignId);
}
