import Link from "next/link";

/**
 * Vive en su propio archivo, y no en `publico.tsx`, porque ese módulo importa
 * Prisma: desde un componente de cliente —el menú flotante— arrastraría el
 * cliente de base de datos al paquete del navegador.
 */

const LETRAS = Array.from("CERNACE");

/**
 * Solo la palabra, sin azulejo. Cada letra es un span con su índice en `--i`
 * para que, al pasar el ratón, la ola recorra la palabra de izquierda a
 * derecha (ver `.logo-letra` en globals.css). Las letras van marcadas como
 * decorativas y la palabra completa queda para lectores de pantalla.
 */
export function PalabraCernace({
  className = "",
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  return (
    <span
      className={`logo-palabra font-heading font-semibold tracking-tight ${compacta ? "text-lg" : "text-2xl"} ${className}`}
    >
      <span className="sr-only">CERNACE</span>
      <span aria-hidden="true">
        {LETRAS.map((letra, i) => (
          <span
            key={i}
            className="logo-letra"
            style={{ "--i": i } as React.CSSProperties}
          >
            {letra}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Logo({
  oscuro = false,
  href = "/",
}: {
  oscuro?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="group inline-flex items-center">
      <PalabraCernace className={oscuro ? "text-crema" : "text-brand-dark"} />
    </Link>
  );
}
