import { Boton } from "@/components/ui";

const OPCIONES = [
  { valor: "NUEVA", etiqueta: "Nueva" },
  { valor: "EN_REVISION", etiqueta: "En revisión" },
  { valor: "APROBADA", etiqueta: "Aprobada" },
  { valor: "RECHAZADA", etiqueta: "Rechazada" },
];

/**
 * Cambio de estado sin JavaScript: un <form> por fila con su propio select.
 * La etiqueta se asocia por id único y se oculta visualmente.
 */
export function SelectorEstado({
  accion,
  id,
  estado,
  descripcion,
}: {
  accion: (datos: FormData) => Promise<void>;
  id: string;
  estado: string;
  descripcion: string;
}) {
  const idSelect = `estado-${id}`;
  return (
    <form action={accion} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={idSelect} className="visually-hidden">
        Cambiar el estado de {descripcion}
      </label>
      <select
        id={idSelect}
        name="estado"
        defaultValue={estado}
        className="rounded-[var(--radius-sm)] border border-line bg-surface px-2 py-1.5 text-xs text-ink"
      >
        {OPCIONES.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      <Boton type="submit" variante="suave" className="px-3 py-1.5 text-xs">
        Guardar
        <span className="visually-hidden"> el estado de {descripcion}</span>
      </Boton>
    </form>
  );
}
