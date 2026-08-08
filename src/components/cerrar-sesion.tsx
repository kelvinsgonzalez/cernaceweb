import { LogOut } from "lucide-react";
import { Boton } from "@/components/ui";
import { cerrarSesion } from "@/app/login/acciones";

export function CerrarSesion({
  variante = "suave",
  className,
}: {
  variante?: "solido" | "contorno" | "suave" | "peligro";
  className?: string;
}) {
  return (
    <form action={cerrarSesion}>
      <Boton type="submit" variante={variante} className={className}>
        <LogOut aria-hidden="true" className="size-4" />
        Cerrar sesión
      </Boton>
    </form>
  );
}
