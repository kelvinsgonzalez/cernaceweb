"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { filaAuditoria, registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { erroresDeZod, type EstadoFormulario } from "@/lib/formularios";
import { slugify } from "@/lib/utils";
import { MAXIMO_HISTORIAS, MAXIMO_RESUMEN } from "@/lib/historias";
import {
  borrarImagenHistoria,
  guardarImagenHistoria,
  validarImagen,
} from "@/lib/almacenamiento";

/**
 * Mantenimiento de las historias de avance que salen en la landing y en la
 * página de donaciones. Todo pasa por /admin/historias.
 *
 * Dos reglas que el formulario no puede garantizar por sí solo y que por eso se
 * comprueban aquí, en el servidor:
 *
 *  1. Visibles, seis como mucho: son las casillas que tiene la portada.
 *  2. Visible exige foto. Una tarjeta de la landing sin imagen queda coja, y lo
 *     que se pide es precisamente una foto con su relato al lado.
 */

const OK_REVISAR = "Revisa los campos marcados.";

const camposHistoria = {
  titulo: z
    .string()
    .trim()
    .min(6, "Escribe un título que cuente el avance.")
    .max(120, "El título no puede pasar de 120 caracteres."),
  protagonista: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del protagonista.")
    .max(60, "El nombre es demasiado largo."),
  programa: z
    .string()
    .trim()
    .max(80, "El programa es demasiado largo.")
    .optional(),
  resumen: z
    .string()
    .trim()
    .min(20, "La historia breve necesita al menos 20 caracteres.")
    .max(
      MAXIMO_RESUMEN,
      `La historia breve no puede pasar de ${MAXIMO_RESUMEN} caracteres.`,
    ),
  contenido: z.string().trim().optional(),
  imagenAlt: z
    .string()
    .trim()
    .max(160, "La descripción de la foto es demasiado larga.")
    .optional(),
  orden: z
    .string()
    .trim()
    .refine(
      (v) =>
        Number.isInteger(Number(v)) &&
        Number(v) >= 1 &&
        Number(v) <= MAXIMO_HISTORIAS,
      { message: `La casilla tiene que ser del 1 al ${MAXIMO_HISTORIAS}.` },
    ),
  estado: z.enum(["BORRADOR", "PUBLICADO"], {
    message: "Indica si la historia se ve en la portada o queda oculta.",
  }),
};

const esquemaNueva = z.object(camposHistoria);
const esquemaEdicion = z.object({ ...camposHistoria, id: z.string().min(1) });

function oNulo(valor: string | undefined): string | null {
  return valor && valor.length > 0 ? valor : null;
}

/** El archivo del formulario, o null si no eligieron ninguno. */
function archivoDe(datos: FormData, campo: string): File | null {
  const entrante = datos.get(campo);
  return entrante instanceof File && entrante.size > 0 ? entrante : null;
}

/**
 * El slug sale del título y tiene que ser único. Si dos historias se llaman
 * igual, la segunda lleva sufijo: nadie debería quedarse sin guardar por eso.
 */
async function slugLibre(titulo: string, excluirId?: string): Promise<string> {
  const base = slugify(titulo) || "historia";
  for (let intento = 0; ; intento += 1) {
    const candidato = intento === 0 ? base : `${base}-${intento + 1}`;
    const ocupado = await prisma.story.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!ocupado || ocupado.id === excluirId) return candidato;
  }
}

/** Cuántas hay publicadas ahora mismo, sin contar la que se está editando. */
function publicadas(excluirId?: string): Promise<number> {
  return prisma.story.count({
    where: {
      estado: "PUBLICADO",
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
  });
}

/**
 * Cada casilla de la portada sostiene una historia y solo una. Se comprueba al
 * dar de alta: entre que la página pintó la casilla vacía y alguien pulsó
 * «Crear», otra persona ha podido ocuparla, y dos historias en el mismo hueco
 * dejarían a una fuera de la portada sin que nadie lo hubiera pedido.
 */
async function ocupante(orden: number, excluirId?: string) {
  return prisma.story.findFirst({
    where: {
      orden,
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
    select: { id: true, titulo: true },
  });
}

export async function crearHistoria(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);

  const parseo = esquemaNueva.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return { error: OK_REVISAR, errores: erroresDeZod(parseo.error) };
  }

  const v = parseo.data;
  const publica = v.estado === "PUBLICADO";
  const imagen = archivoDe(datos, "imagen");

  if (imagen) {
    const problema = validarImagen(imagen);
    if (problema) return { error: OK_REVISAR, errores: { imagen: problema } };
  }

  if (publica && !imagen) {
    return {
      error: OK_REVISAR,
      errores: {
        imagen:
          "Para que salga en la portada hace falta la fotografía. Sin ella, guárdala como oculta.",
      },
    };
  }

  const casilla = Number(v.orden);
  const ocupada = await ocupante(casilla);
  if (ocupada) {
    return {
      error: `La casilla ${casilla} ya la ocupa «${ocupada.titulo}». Recárgala para verla, o edítala en su propia casilla.`,
    };
  }

  if (publica && (await publicadas()) >= MAXIMO_HISTORIAS) {
    return {
      error: `La portada ya tiene sus ${MAXIMO_HISTORIAS} historias a la vista. Oculta antes alguna.`,
    };
  }

  const guardada = imagen ? await guardarImagenHistoria(imagen) : null;

  const historia = await prisma.story.create({
    data: {
      titulo: v.titulo,
      slug: await slugLibre(v.titulo),
      resumen: v.resumen,
      // Sin relato largo, el breve hace de las dos cosas: la columna no admite
      // nulos y duplicarlo es mejor que obligar a escribir dos veces lo mismo.
      contenido: oNulo(v.contenido) ?? v.resumen,
      protagonista: v.protagonista,
      programa: oNulo(v.programa),
      imagenArchivo: guardada?.archivo ?? null,
      imagenTipoMime: guardada?.tipoMime ?? null,
      imagenAlt: oNulo(v.imagenAlt),
      orden: casilla,
      estado: v.estado,
    },
    select: { id: true },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "CREAR",
    entidad: "Story",
    entidadId: historia.id,
    detalle: `Historia «${v.titulo}» ${publica ? "publicada" : "guardada oculta"} en la casilla ${casilla}`,
  });

  revalidarHistorias();

  return {
    ok: publica
      ? `Historia guardada en la casilla ${casilla}. Ya se ve en la página de inicio.`
      : `Historia guardada y oculta en la casilla ${casilla}. Todavía no se ve en la página.`,
  };
}

export async function actualizarHistoria(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);

  const parseo = esquemaEdicion.safeParse(Object.fromEntries(datos));
  if (!parseo.success) {
    return { error: OK_REVISAR, errores: erroresDeZod(parseo.error) };
  }

  const v = parseo.data;
  const historia = await prisma.story.findUnique({
    where: { id: v.id },
    select: {
      id: true,
      titulo: true,
      slug: true,
      imagenArchivo: true,
      imagenUrl: true,
      estado: true,
    },
  });
  if (!historia) return { error: "Esa historia ya no existe." };

  const publica = v.estado === "PUBLICADO";
  const imagen = archivoDe(datos, "imagen");
  const quitar = datos.get("quitarImagen") === "on" && !imagen;

  if (imagen) {
    const problema = validarImagen(imagen);
    if (problema) return { error: OK_REVISAR, errores: { imagen: problema } };
  }

  const seQuedaSinFoto =
    !imagen && (quitar || (!historia.imagenArchivo && !historia.imagenUrl));
  if (publica && seQuedaSinFoto) {
    return {
      error: OK_REVISAR,
      errores: {
        imagen:
          "Para que salga en la portada hace falta la fotografía. Sin ella, guárdala como oculta.",
      },
    };
  }

  // Al editar no se comprueba si la casilla está ocupada: la historia se abrió
  // desde ella, así que guardar es justo lo que deja su posición en su sitio.
  // Bloquearlo aquí solo serviría para que una fila con la posición repetida no
  // se pudiera arreglar nunca.
  const casilla = Number(v.orden);

  if (
    publica &&
    historia.estado !== "PUBLICADO" &&
    (await publicadas(historia.id)) >= MAXIMO_HISTORIAS
  ) {
    return {
      error: `La portada ya tiene sus ${MAXIMO_HISTORIAS} historias a la vista. Oculta antes alguna.`,
    };
  }

  const anterior = historia.imagenArchivo;
  const guardada = imagen ? await guardarImagenHistoria(imagen) : null;

  await prisma.story.update({
    where: { id: historia.id },
    data: {
      titulo: v.titulo,
      slug:
        v.titulo === historia.titulo
          ? historia.slug
          : await slugLibre(v.titulo, historia.id),
      resumen: v.resumen,
      contenido: oNulo(v.contenido) ?? v.resumen,
      protagonista: v.protagonista,
      programa: oNulo(v.programa),
      ...(guardada
        ? {
            imagenArchivo: guardada.archivo,
            imagenTipoMime: guardada.tipoMime,
            // La subida manda sobre la ruta estática que trajera el seed.
            imagenUrl: null,
          }
        : quitar
          ? { imagenArchivo: null, imagenTipoMime: null, imagenUrl: null }
          : {}),
      imagenAlt: oNulo(v.imagenAlt),
      orden: casilla,
      estado: v.estado,
    },
  });

  // El archivo viejo se borra después de que la base apunte al nuevo: si algo
  // falla antes, queda un archivo de más y no una foto rota.
  if (anterior && (guardada || quitar)) await borrarImagenHistoria(anterior);

  await registrarAuditoria({
    actor: actor.email,
    accion: "ACTUALIZAR",
    entidad: "Story",
    entidadId: historia.id,
    detalle: `Historia «${v.titulo}» actualizada en la casilla ${casilla} (${publica ? "visible" : "oculta"})`,
  });

  revalidarHistorias();

  return { ok: "Cambios guardados." };
}

/**
 * Mostrar u ocultar la historia en la portada, sin abrirla. Ocultar no borra
 * nada: la historia se queda entera en su casilla, en borrador, y deja de
 * salir en la landing y en la página de donaciones hasta que se vuelva a
 * mostrar.
 *
 * Es un formulario normal, así que funciona sin JavaScript; lo que tenga que
 * decir lo dice volviendo al listado con un aviso en la URL.
 */
export async function alternarVisibilidadHistoria(
  datos: FormData,
): Promise<void> {
  const actor = await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) redirect("/admin/historias");

  const historia = await prisma.story.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      estado: true,
      imagenArchivo: true,
      imagenUrl: true,
    },
  });
  if (!historia) redirect("/admin/historias");

  const mostrar = historia.estado !== "PUBLICADO";

  if (mostrar && !historia.imagenArchivo && !historia.imagenUrl) {
    redirect(`/admin/historias?aviso=sin-foto&id=${historia.id}`);
  }

  if (mostrar && (await publicadas(historia.id)) >= MAXIMO_HISTORIAS) {
    redirect("/admin/historias?aviso=tope");
  }

  await prisma.story.update({
    where: { id: historia.id },
    data: { estado: mostrar ? "PUBLICADO" : "BORRADOR" },
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: mostrar ? "MOSTRAR" : "OCULTAR",
    entidad: "Story",
    entidadId: historia.id,
    detalle: `Historia «${historia.titulo}» ${mostrar ? "mostrada en la portada" : "ocultada de la portada; sigue en su casilla como borrador"}`,
  });

  revalidarHistorias();
  redirect(`/admin/historias?aviso=${mostrar ? "mostrada" : "oculta"}`);
}

/**
 * Vaciar la casilla: se lleva la historia entera —texto y fotografía— y deja la
 * posición libre para escribir otra. Es la única acción que borra; «ocultar» no
 * toca nada.
 */
export async function vaciarCasilla(datos: FormData): Promise<void> {
  const actor = await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);

  const id = String(datos.get("id") ?? "");
  if (!id) redirect("/admin/historias");

  const historia = await prisma.story.findUnique({
    where: { id },
    select: { id: true, titulo: true, orden: true, imagenArchivo: true },
  });
  if (!historia) redirect("/admin/historias");

  // La bitácora es lo único que queda después de esto, así que se escribe
  // dentro de la misma transacción que el borrado.
  await prisma.$transaction(async (tx) => {
    await tx.story.delete({ where: { id: historia.id } });
    await tx.auditLog.create({
      data: await filaAuditoria({
        actor: actor.email,
        accion: "ELIMINAR",
        entidad: "Story",
        entidadId: historia.id,
        detalle: `Casilla ${historia.orden} vaciada: se eliminó la historia «${historia.titulo}»`,
      }),
    });
  });

  if (historia.imagenArchivo) await borrarImagenHistoria(historia.imagenArchivo);

  revalidarHistorias();
  redirect("/admin/historias?aviso=vaciada");
}

/** Las tres páginas donde una historia se ve. */
function revalidarHistorias(): void {
  revalidatePath("/admin/historias");
  revalidatePath("/");
  revalidatePath("/donar");
}
