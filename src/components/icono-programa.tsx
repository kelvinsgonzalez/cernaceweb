import {
  Activity,
  Baby,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

/**
 * Los programas guardan el nombre del icono en la base. Se mapea aquí para no
 * importar lucide-react entero ni confiar en un nombre arbitrario.
 */
const ICONOS: Record<string, LucideIcon> = {
  Activity,
  Baby,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Puzzle,
};

export function IconoPrograma({
  nombre,
  className,
}: {
  nombre: string;
  className?: string;
}) {
  const Icono = ICONOS[nombre] ?? HeartHandshake;
  return <Icono aria-hidden="true" className={className} />;
}
