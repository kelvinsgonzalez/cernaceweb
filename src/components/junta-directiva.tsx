import { BadgeCheck, UsersRound, type LucideIcon } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import { SeccionPlegable } from "@/components/plegable";

/* -------------------------------------------------------------------------
   Junta directiva y comité de fiscalización

   Listado vigente ante el Ministerio de Salud Pública y Asistencia Social.
   Se publican nombre y cargo: el DPI y el NIT del acta no salen del
   expediente. No viene de la base de datos porque cambia cuando cambia el
   acta de la asamblea, no desde el panel.
   ------------------------------------------------------------------------- */

const JUNTA_DIRECTIVA = [
  { nombre: "Daniel Leal Salazar", cargo: "Presidente y representante legal" },
  { nombre: "Vilmer Noel Herrera De León", cargo: "Vicepresidente" },
  { nombre: "Rolendio Hermocindo Gil Pereira", cargo: "Secretario" },
  { nombre: "Noé Yovany Gálvez Robledo", cargo: "Tesorero" },
  { nombre: "Antonio Velásquez Morales", cargo: "Vocal I" },
  { nombre: "Julio Rodolfo Divas Navarro", cargo: "Vocal II" },
];

const COMITE_FISCALIZACION = [
  { nombre: "Heidy Maridalia Rodríguez Carbajal", cargo: "Presidenta" },
  { nombre: "Isaías Osnibal Gálvez Robledo", cargo: "Vicepresidente" },
  { nombre: "Amarildo Leví Méndez Vásquez", cargo: "Secretario" },
  { nombre: "Ángela Marleny Gálvez Roblero", cargo: "Tesorera" },
];

/**
 * Bloque desplegable para la página de contacto. Cerrado por defecto: el
 * directorio de empleados es lo que la mayoría busca; quien quiere saber
 * quién dirige la asociación lo abre con «Ver más».
 */
export function SeccionJuntaDirectiva() {
  return (
    <section aria-labelledby="junta-directiva-titulo">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="rotulo text-brand-primary">Cómo nos organizamos</p>
        <div className="mt-3">
          <SeccionPlegable
            titulo="Conoce a la Junta Directiva actual"
            tituloId="junta-directiva-titulo"
          >
            <p className="medida-lectura mt-3 text-ink-soft">
              La asamblea general elige cada año a la junta directiva y al
              comité de fiscalización, y el listado se actualiza ante el
              Ministerio de Salud Pública y Asistencia Social.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <ListaCargos
                titulo="Junta directiva 2026"
                icono={UsersRound}
                personas={JUNTA_DIRECTIVA}
              />
              <ListaCargos
                titulo="Comité de fiscalización"
                icono={BadgeCheck}
                personas={COMITE_FISCALIZACION}
              />
            </div>
          </SeccionPlegable>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   Piezas internas
   ------------------------------------------------------------------------- */

function ListaCargos({
  titulo,
  icono: Icono,
  personas,
}: {
  titulo: string;
  icono: LucideIcon;
  personas: { nombre: string; cargo: string }[];
}) {
  return (
    <Tarjeta className="revela tarjeta-viva h-full p-6 sm:p-8">
      <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
        <Icono aria-hidden="true" className="size-5 text-brand-primary" />
        {titulo}
      </h3>
      <ul className="mt-5 divide-y divide-line">
        {personas.map((persona) => (
          <li key={persona.nombre} className="flex items-center gap-3 py-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-sky text-sm font-semibold text-brand-primary"
            >
              {inicialesNombre(persona.nombre)}
            </span>
            <div>
              <p className="font-medium text-ink">{persona.nombre}</p>
              <p className="text-sm text-ink-soft">{persona.cargo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

/** Primera letra del nombre y del primer apellido, para el círculo de la lista. */
function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase();
}
