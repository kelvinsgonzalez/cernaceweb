import { Check, ChevronDown, X } from "lucide-react";
import { ChipEstadoBeneficiario, ChipEstadoExpediente } from "@/components/ui";
import { OpcionMenu } from "@/components/admin/menu-acciones";
import { cambiarEstadoBeneficiario, cambiarEstadoExpediente } from "../acciones";

/**
 * Los dos estados del expediente, debajo del nombre, como chips que se pueden
 * cambiar en el sitio. El chip es el botón: al tocarlo se abre un panel con
 * las otras opciones y cada una es un formulario con su server action, así que
 * funciona sin JavaScript igual que el menú de acciones (Popover API).
 *
 * Sin permiso de escritura se pintan los chips de siempre, sin flecha.
 */

type Opcion = { valor: string; etiqueta: string; ayuda: string };

const ESTADOS_BENEFICIARIO: Opcion[] = [
  { valor: "ACTIVO", etiqueta: "Activo", ayuda: "Recibe atención en el centro." },
  {
    valor: "INACTIVO",
    etiqueta: "Inactivo",
    ayuda: "Dejó de asistir. El expediente se conserva y sale de la galería pública.",
  },
  {
    valor: "EGRESADO",
    etiqueta: "Egresado",
    ayuda: "Terminó su proceso en el centro.",
  },
];

const ESTADOS_EXPEDIENTE: Opcion[] = [
  {
    valor: "COMPLETO",
    etiqueta: "Expediente completo",
    ayuda: "Toda la papelería está entregada y revisada.",
  },
  {
    valor: "EN_REVISION",
    etiqueta: "Expediente en revisión",
    ayuda: "Hay documentos pendientes de revisar o cotejar.",
  },
  {
    valor: "INCOMPLETO",
    etiqueta: "Expediente incompleto",
    ayuda: "Faltan documentos por entregar.",
  },
];

export function EstadosCabecera({
  id,
  estado,
  estadoExpediente,
  editable,
}: {
  id: string;
  estado: string;
  estadoExpediente: string;
  editable: boolean;
}) {
  if (!editable) {
    return (
      <>
        <ChipEstadoBeneficiario estado={estado} />
        <ChipEstadoExpediente estado={estadoExpediente} />
      </>
    );
  }

  return (
    <>
      <ChipCambiable
        panel={`estado-beneficiario-${id}`}
        titulo="Estado del beneficiario"
        actual={estado}
        opciones={ESTADOS_BENEFICIARIO}
        accion={cambiarEstadoBeneficiario}
        campo="estado"
        id={id}
        chip={<ChipEstadoBeneficiario estado={estado} />}
      />
      <ChipCambiable
        panel={`estado-expediente-${id}`}
        titulo="Estado del expediente"
        actual={estadoExpediente}
        opciones={ESTADOS_EXPEDIENTE}
        accion={cambiarEstadoExpediente}
        campo="estadoExpediente"
        id={id}
        chip={<ChipEstadoExpediente estado={estadoExpediente} />}
      />
    </>
  );
}

function ChipCambiable({
  panel,
  titulo,
  actual,
  opciones,
  accion,
  campo,
  id,
  chip,
}: {
  /** Único en la página: id del panel que abre el chip. */
  panel: string;
  titulo: string;
  actual: string;
  opciones: Opcion[];
  accion: (datos: FormData) => Promise<void>;
  /** Nombre del campo que lee la acción. */
  campo: string;
  id: string;
  chip: React.ReactNode;
}) {
  const etiquetaActual =
    opciones.find((o) => o.valor === actual)?.etiqueta ?? actual;

  return (
    <>
      <button
        type="button"
        popoverTarget={panel}
        aria-label={`${titulo}: ${etiquetaActual}. Cambiar`}
        className="menu-disparador group inline-flex items-center gap-1 rounded-full transition hover:-translate-y-px"
      >
        {chip}
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-ink-soft transition group-hover:text-brand-primary"
        />
      </button>

      {/* La clave es el valor actual: al cambiar, el panel se vuelve a montar
          cerrado en vez de quedarse abierto enseñando la opción recién elegida. */}
      <div key={actual} id={panel} popover="auto" className="menu-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line px-2 pb-2">
          <p className="truncate text-xs font-semibold tracking-wide text-ink-soft uppercase">
            {titulo}
          </p>
          <button
            type="button"
            popoverTarget={panel}
            popoverTargetAction="hide"
            aria-label="Cerrar el menú"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-brand-sky hover:text-brand-dark"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1 pt-2">
          {opciones.map((opcion) =>
            opcion.valor === actual ? (
              <div
                key={opcion.valor}
                aria-current="true"
                className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-canvas px-3 py-2.5 text-sm"
              >
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-ok-fg"
                />
                <span>
                  <span className="block font-semibold text-ink">
                    {opcion.etiqueta}
                    <span className="ml-1 text-xs font-normal text-ink-soft">
                      (actual)
                    </span>
                  </span>
                  <span className="block text-xs text-ink-soft">{opcion.ayuda}</span>
                </span>
              </div>
            ) : (
              <form key={opcion.valor} action={accion}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name={campo} value={opcion.valor} />
                <OpcionMenu className="flex-col items-start gap-0">
                  <span>{opcion.etiqueta}</span>
                  <span className="text-xs font-normal text-ink-soft">
                    {opcion.ayuda}
                  </span>
                </OpcionMenu>
              </form>
            ),
          )}
        </div>
      </div>
    </>
  );
}
