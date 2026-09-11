import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Sin `fotoUrl` cae al bloque con la inicial. La imagen es decorativa —el nombre
 * y la edad van en el texto de la tarjeta—, de ahí el alt vacío y el aria-hidden.
 */
export function FotoBeneficiario({
  nombre,
  fotoUrl,
  className,
  tamano = 96,
  sinOptimizar,
}: {
  nombre: string;
  fotoUrl?: string | null;
  className?: string;
  tamano?: number;
  /** En el panel: la foto de un niño sin publicar solo se sirve con sesión, y
   *  el optimizador de Next la pide sin ella y recibe un 404. */
  sinOptimizar?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: tamano, height: tamano }}
      className={cn("block shrink-0 overflow-hidden rounded-full", className)}
    >
      <Contenido
        nombre={nombre}
        fotoUrl={fotoUrl}
        ancho={tamano}
        alto={tamano}
        sinOptimizar={sinOptimizar}
      />
    </span>
  );
}

export function PortadaBeneficiario({
  nombre,
  fotoUrl,
  className,
}: {
  nombre: string;
  fotoUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-sm)]",
        className,
      )}
    >
      <Contenido nombre={nombre} fotoUrl={fotoUrl} ancho={600} alto={800} />
    </span>
  );
}

function Contenido({
  nombre,
  fotoUrl,
  ancho,
  alto,
  sinOptimizar,
}: {
  nombre: string;
  fotoUrl?: string | null;
  ancho: number;
  alto: number;
  sinOptimizar?: boolean;
}) {
  if (!fotoUrl) {
    return (
      <span
        style={{ fontSize: Math.max(18, Math.min(ancho, alto) * 0.34) }}
        className="flex size-full items-center justify-center bg-brand-yellow font-heading font-bold text-brand-dark"
      >
        {nombre[0]}
      </span>
    );
  }
  return (
    <Image
      src={fotoUrl}
      alt=""
      width={ancho}
      height={alto}
      unoptimized={sinOptimizar}
      // Los retratos vienen en vertical: se encuadra hacia arriba para no
      // cortar la cara cuando el marco es más ancho que la foto.
      className="size-full object-cover object-top"
    />
  );
}
