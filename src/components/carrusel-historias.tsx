import { prisma } from "@/lib/prisma";
import { Carrusel, type Lamina } from "@/components/carrusel";
import {
  MAXIMO_HISTORIAS,
  textoAlternativo,
  urlImagenHistoria,
} from "@/lib/historias";

/**
 * Las historias de éxito en carrusel: las mismas que publica el equipo desde
 * /admin/historias, en el mismo orden. Cada lámina lleva la foto, el título,
 * el relato breve y el enlace a la historia completa. Sin historias con foto
 * no se pinta nada: ni el título ni un marco vacío.
 */
export async function CarruselHistorias({ className }: { className?: string }) {
  const historias = await prisma.story.findMany({
    where: { estado: "PUBLICADO" },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    take: MAXIMO_HISTORIAS,
    select: {
      id: true,
      titulo: true,
      resumen: true,
      protagonista: true,
      imagenUrl: true,
      imagenArchivo: true,
      imagenAlt: true,
      slug: true,
    },
  });

  const laminas: Lamina[] = historias
    .map((historia) => ({ historia, imagen: urlImagenHistoria(historia) }))
    // Sin foto no hay lámina que enseñar. `urlImagenHistoria` también descarta
    // una URL externa guardada a mano: next/image solo tiene configurado el
    // dominio propio y reventaría la página entera.
    .filter((fila) => fila.imagen !== null)
    .map(({ historia, imagen }) => ({
      src: imagen as string,
      alt: textoAlternativo(historia),
      pie: historia.titulo,
      titulo: historia.titulo,
      // En la lámina cabe el relato breve; el largo se lee en su página.
      texto: historia.resumen,
      enlace: {
        href: `/historias/${historia.slug}`,
        etiqueta: "Ver la historia completa",
      },
    }));

  if (laminas.length === 0) return null;

  return (
    <section className={className} aria-labelledby="historias-titulo">
      <h2
        id="historias-titulo"
        className="font-heading text-2xl font-semibold text-ink sm:text-3xl"
      >
        Conoce nuestras historias de éxito
      </h2>
      <Carrusel
        laminas={laminas}
        etiqueta="Historias de quienes reciben tu apoyo"
        encuadre="cover"
        className="mt-6"
      />
    </section>
  );
}
