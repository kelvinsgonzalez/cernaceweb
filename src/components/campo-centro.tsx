import { CampoTexto } from "@/components/ui";
import { CENTROS } from "@/lib/centros";

/**
 * Centro de atención: texto libre con los centros conocidos como sugerencia.
 * El `datalist` deja escribir uno nuevo sin cambiar el código.
 */
export function CampoCentro({
  defaultValue,
  error,
  ayuda = "San Pedro o Posonicapa, en Cuilco. Escribe otro si hace falta.",
}: {
  defaultValue: string;
  error?: string;
  ayuda?: string;
}) {
  return (
    <>
      <CampoTexto
        id="centroAtencion"
        name="centroAtencion"
        etiqueta="Centro de atención"
        ayuda={ayuda}
        requerido
        list="centros-atencion"
        defaultValue={defaultValue}
        error={error}
        autoComplete="off"
      />
      <datalist id="centros-atencion">
        {CENTROS.map((centro) => (
          <option key={centro} value={centro} />
        ))}
      </datalist>
    </>
  );
}
