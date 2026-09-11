import type { ReactNode } from "react";
import { Tarjeta } from "@/components/ui";

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="medida-lectura mt-2 text-ink-soft">{descripcion}</p>
        ) : null}
      </div>
      {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
    </div>
  );
}

export function Tabla({
  caption,
  columnas,
  className,
  children,
}: {
  caption: string;
  columnas: string[];
  /** Para la tabla, no para la tarjeta: p. ej. `tabla-acciones-fijas`. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tarjeta className="overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className={`w-full min-w-[42rem] text-left text-sm ${className ?? ""}`}
        >
          <caption className="visually-hidden">{caption}</caption>
          <thead className="border-b border-line bg-canvas">
            <tr>
              {columnas.map((columna) => (
                <th
                  key={columna}
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </Tarjeta>
  );
}

export function Fila({ children }: { children: ReactNode }) {
  return <tr className="align-top hover:bg-canvas">{children}</tr>;
}

export function Celda({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-ink ${className ?? ""}`}>{children}</td>
  );
}

export function FilaVacia({
  columnas,
  mensaje,
}: {
  columnas: number;
  mensaje: string;
}) {
  return (
    <tr>
      <td
        colSpan={columnas}
        className="px-4 py-10 text-center text-sm text-ink-soft"
      >
        {mensaje}
      </td>
    </tr>
  );
}
