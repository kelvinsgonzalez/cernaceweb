import Link from "next/link";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vive en su propio archivo, y no en `publico.tsx`, porque ese módulo importa
 * Prisma: desde un componente de cliente —el menú flotante— arrastraría el
 * cliente de base de datos al paquete del navegador.
 */

/** El azulejo de la marca: la urdimbre del telar y, encima, la sonrisa. */
export function MarcaCernace({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "trama-fina-clara flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-primary text-brand-yellow ring-1 ring-brand-yellow/60 transition-transform duration-300 ease-suave group-hover:-rotate-3",
        className,
      )}
    >
      <Smile className="size-6" />
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
    <Link href={href} className="group flex items-center gap-3">
      <MarcaCernace />
      <span
        className={`font-heading text-2xl font-semibold tracking-tight ${oscuro ? "text-crema" : "text-brand-dark"}`}
      >
        CERNACE
      </span>
    </Link>
  );
}
