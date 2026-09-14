import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { formatFechaLarga } from "@/lib/fechas";
import { textoAlternativo, urlImagenHistoria } from "@/lib/historias";

export const dynamic = "force-dynamic";

/**
 * El relato completo de una historia de avance. Es la página a la que lleva el
 * botón del carrusel de /donar.
 *
 * Solo existe mientras la historia esté a la vista: un borrador —lo que el
 * equipo todavía no ha decidido publicar— devuelve 404 aunque alguien acierte
 * con la dirección.
 */
async function buscarHistoria(slug: string) {
  return prisma.story.findFirst({
    where: { slug, estado: "PUBLICADO" },
    select: {
      id: true,
      titulo: true,
      resumen: true,
      contenido: true,
      protagonista: true,
      programa: true,
      publicadaEn: true,
      imagenUrl: true,
      imagenArchivo: true,
      imagenAlt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const historia = await buscarHistoria(slug);
  if (!historia) return { title: "Historia no disponible" };
  return { title: historia.titulo, description: historia.resumen };
}

export default async function HistoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const historia = await buscarHistoria(slug);
  if (!historia) notFound();

  const imagen = urlImagenHistoria(historia);

  // Cuando no se escribió un relato aparte, el largo es una copia del breve:
  // enseñarlo dos veces seguidas haría creer que la página está repetida.
  const relato =
    historia.contenido.trim() === historia.resumen.trim()
      ? []
      : historia.contenido
          .split(/\n+/)
          .map((parrafo) => parrafo.trim())
          .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/donar"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a las historias
      </Link>

      <Tarjeta className="mt-6 overflow-hidden">
        {imagen ? (
          <Image
            src={imagen}
            alt={textoAlternativo(historia)}
            width={1200}
            height={900}
            unoptimized
            priority
            className="aspect-[4/3] w-full bg-brand-sky object-cover sm:aspect-[16/9]"
          />
        ) : null}

        <div className="p-6 sm:p-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {historia.titulo}
          </h1>
          <p className="mt-2 text-sm font-medium text-brand-primary">
            {historia.protagonista}
            {historia.programa ? ` · ${historia.programa}` : ""} ·{" "}
            {formatFechaLarga(historia.publicadaEn)}
          </p>

          <p className="medida-lectura mt-6 text-lg text-ink">
            {historia.resumen}
          </p>

          {relato.map((parrafo, indice) => (
            <p
              key={indice}
              className="medida-lectura mt-4 text-ink-soft"
            >
              {parrafo}
            </p>
          ))}

          <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-5">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-brand-dark"
            />
            <p className="medida-lectura text-sm text-brand-dark">
              Publicamos estas historias con el permiso de la familia y solo con
              el primer nombre. El expediente, con el diagnóstico y los datos
              familiares, es confidencial.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <EnlaceBoton href="/donar" className="px-6 py-3 text-base">
              Aportar a una nueva historia
            </EnlaceBoton>
            <EnlaceBoton
              href="/inscripcion/padrino"
              variante="contorno"
              className="px-6 py-3 text-base"
            >
              Ser padrino
            </EnlaceBoton>
          </div>
        </div>
      </Tarjeta>
    </div>
  );
}
