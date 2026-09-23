import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleSlash,
  Clock3,
  Lock,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
   Superficies
   ------------------------------------------------------------------------- */

export function Tarjeta({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-line bg-surface shadow-suave",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TarjetaCabecera({
  titulo,
  descripcion,
  icono,
  acciones,
  id,
  nivel = 2,
}: {
  titulo: string;
  descripcion?: string;
  icono?: ReactNode;
  acciones?: ReactNode;
  id?: string;
  nivel?: 2 | 3;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3">
        {icono ? (
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-sky text-brand-primary"
          >
            {icono}
          </span>
        ) : null}
        <div>
          <Titulo id={id} className="text-lg font-semibold text-ink">
            {titulo}
          </Titulo>
          {descripcion ? (
            <p className="medida-lectura mt-1 text-sm text-ink-soft">{descripcion}</p>
          ) : null}
        </div>
      </div>
      {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Botones y enlaces de acción
   ------------------------------------------------------------------------- */

type Variante = "solido" | "contorno" | "suave" | "peligro" | "gris";

const estilosBoton: Record<Variante, string> = {
  solido:
    "bg-brand-primary text-white border border-transparent shadow-suave hover:bg-brand-dark hover:shadow-alta",
  contorno:
    "bg-surface text-brand-dark border border-brand-primary/45 hover:border-brand-primary hover:bg-brand-sky",
  suave: "bg-brand-sky text-brand-dark border border-transparent hover:bg-crema",
  peligro:
    "bg-danger text-white border border-transparent shadow-suave hover:bg-danger-dark",
  // Acción secundaria que no compite con la principal: informes, exportaciones.
  gris: "bg-canvas text-ink-soft border border-line hover:border-ink-soft/50 hover:bg-line/60 hover:text-ink",
};

// El botón se levanta un pixel al pasar el puntero; con `prefers-reduced-motion`
// la regla global deja la transición en cero y solo cambia el color.
const baseBoton =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition duration-300 ease-suave hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function Boton({
  variante = "solido",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={cn(baseBoton, estilosBoton[variante], className)}
      {...props}
    />
  );
}

export function EnlaceBoton({
  variante = "solido",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return (
    <Link className={cn(baseBoton, estilosBoton[variante], className)} {...props} />
  );
}

/* -------------------------------------------------------------------------
   Chips de estado — nunca comunican solo con color: cada uno lleva icono.
   ------------------------------------------------------------------------- */

type Tono = "ok" | "warn" | "bad" | "neutro" | "info";

const estilosChip: Record<Tono, string> = {
  ok: "bg-ok-bg text-ok-fg ring-1 ring-ok-fg/15",
  warn: "bg-warn-bg text-warn-fg ring-1 ring-warn-fg/15",
  bad: "bg-bad-bg text-bad-fg ring-1 ring-bad-fg/15",
  neutro: "bg-canvas text-ink-soft border border-line",
  info: "bg-brand-sky text-brand-dark ring-1 ring-brand-primary/20",
};

const iconoPorTono: Record<Tono, ReactNode> = {
  ok: <CircleCheck aria-hidden="true" className="size-4 shrink-0" />,
  warn: <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />,
  bad: <CircleAlert aria-hidden="true" className="size-4 shrink-0" />,
  neutro: <CircleMinus aria-hidden="true" className="size-4 shrink-0" />,
  info: <Clock3 aria-hidden="true" className="size-4 shrink-0" />,
};

export function Chip({
  tono = "neutro",
  children,
  icono,
  className,
}: {
  tono?: Tono;
  children: ReactNode;
  icono?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        estilosChip[tono],
        className,
      )}
    >
      {icono ?? iconoPorTono[tono]}
      {children}
    </span>
  );
}

const TONO_ESTADO_EXPEDIENTE: Record<string, Tono> = {
  COMPLETO: "ok",
  EN_REVISION: "warn",
  INCOMPLETO: "bad",
};

const ETIQUETA_ESTADO_EXPEDIENTE: Record<string, string> = {
  COMPLETO: "Expediente completo",
  EN_REVISION: "Expediente en revisión",
  INCOMPLETO: "Expediente incompleto",
};

export function ChipEstadoExpediente({ estado }: { estado: string }) {
  return (
    <Chip tono={TONO_ESTADO_EXPEDIENTE[estado] ?? "neutro"}>
      {ETIQUETA_ESTADO_EXPEDIENTE[estado] ?? estado}
    </Chip>
  );
}

const TONO_ESTADO_BENEFICIARIO: Record<string, Tono> = {
  ACTIVO: "ok",
  INACTIVO: "neutro",
  EGRESADO: "info",
};

export function ChipEstadoBeneficiario({ estado }: { estado: string }) {
  const etiquetas: Record<string, string> = {
    ACTIVO: "Activo",
    INACTIVO: "Inactivo",
    EGRESADO: "Egresado",
  };
  return (
    <Chip tono={TONO_ESTADO_BENEFICIARIO[estado] ?? "neutro"}>
      {etiquetas[estado] ?? estado}
    </Chip>
  );
}

const TONO_VULNERABILIDAD: Record<string, Tono> = {
  BAJO: "ok",
  MEDIO: "warn",
  ALTO: "bad",
};

export function ChipVulnerabilidad({ nivel }: { nivel: string }) {
  return (
    <Chip tono={TONO_VULNERABILIDAD[nivel] ?? "neutro"}>
      Vulnerabilidad {nivel.toLowerCase()}
    </Chip>
  );
}

const TONO_DONACION: Record<string, Tono> = {
  COMPLETADA: "ok",
  PENDIENTE: "warn",
  FALLIDA: "bad",
  REEMBOLSADA: "neutro",
};

export function ChipDonacion({ estado }: { estado: string }) {
  const etiquetas: Record<string, string> = {
    COMPLETADA: "Completada",
    PENDIENTE: "Pendiente",
    FALLIDA: "Fallida",
    REEMBOLSADA: "Reembolsada",
  };
  return (
    <Chip tono={TONO_DONACION[estado] ?? "neutro"}>
      {etiquetas[estado] ?? estado}
    </Chip>
  );
}

const TONO_SOLICITUD: Record<string, Tono> = {
  NUEVA: "info",
  EN_REVISION: "warn",
  APROBADA: "ok",
  RECHAZADA: "bad",
};

export function ChipSolicitud({ estado }: { estado: string }) {
  const etiquetas: Record<string, string> = {
    NUEVA: "Nueva",
    EN_REVISION: "En revisión",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
  };
  return (
    <Chip tono={TONO_SOLICITUD[estado] ?? "neutro"}>
      {etiquetas[estado] ?? estado}
    </Chip>
  );
}

/* -------------------------------------------------------------------------
   Bloques informativos
   ------------------------------------------------------------------------- */

export function Kpi({
  etiqueta,
  valor,
  detalle,
  icono,
}: {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  icono?: ReactNode;
}) {
  return (
    <Tarjeta className="tarjeta-viva p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="rotulo text-[0.68rem] tracking-[0.12em] text-ink-soft">{etiqueta}</p>
        {icono ? (
          <span aria-hidden="true" className="text-brand-primary">
            {icono}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl">
        {valor}
      </p>
      {detalle ? <p className="mt-1 text-sm text-ink-soft">{detalle}</p> : null}
    </Tarjeta>
  );
}

export function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-ink">{children || "—"}</dd>
    </div>
  );
}

/** Lo que ve un rol sin permiso: el dato no se consultó, no está oculto con CSS. */
export function AccesoRestringido({
  titulo = "Acceso restringido",
  mensaje,
}: {
  titulo?: string;
  mensaje: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-5">
      <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-soft" />
      <div>
        <p className="font-semibold text-ink">{titulo}</p>
        <p className="medida-lectura mt-1 text-sm text-ink-soft">{mensaje}</p>
      </div>
    </div>
  );
}

export function Vacio({
  mensaje,
  icono,
}: {
  mensaje: string;
  icono?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <span aria-hidden="true" className="text-ink-soft">
        {icono ?? <CircleSlash className="size-6" />}
      </span>
      <p className="text-sm text-ink-soft">{mensaje}</p>
    </div>
  );
}

export function Progreso({
  valor,
  etiqueta,
}: {
  valor: number;
  etiqueta: string;
}) {
  const porcentaje = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-soft">{etiqueta}</span>
        <span className="font-heading text-lg font-semibold text-ink">
          {porcentaje}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiqueta}
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-brand-sky ring-1 ring-line"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-green transition-[width] duration-700 ease-suave"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Formularios
   ------------------------------------------------------------------------- */

const baseControl =
  "w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink transition-colors duration-200 placeholder:text-ink-soft/70 hover:border-brand-primary/45 focus:border-brand-primary aria-[invalid=true]:border-danger";

export function CampoTexto({
  id,
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  ...props
}: ComponentProps<"input"> & {
  id: string;
  etiqueta: ReactNode;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
}) {
  // La ayuda va antes del control: si el navegador despliega el
  // autocompletado hacia abajo, no la tapa.
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descrito = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {etiqueta}
        {requerido ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
        {requerido ? <span className="visually-hidden">(obligatorio)</span> : null}
      </label>
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-ink-soft">
          {ayuda}
        </p>
      ) : null}
      <input
        id={id}
        aria-describedby={descrito}
        aria-invalid={error ? true : undefined}
        required={requerido}
        className={baseControl}
        {...props}
      />
      {error ? (
        <p id={idError} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CampoArea({
  id,
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  ...props
}: ComponentProps<"textarea"> & {
  id: string;
  etiqueta: ReactNode;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descrito = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {etiqueta}
        {requerido ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
        {requerido ? <span className="visually-hidden">(obligatorio)</span> : null}
      </label>
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-ink-soft">
          {ayuda}
        </p>
      ) : null}
      <textarea
        id={id}
        rows={4}
        aria-describedby={descrito}
        aria-invalid={error ? true : undefined}
        required={requerido}
        className={baseControl}
        {...props}
      />
      {error ? (
        <p id={idError} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CampoSelect({
  id,
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  children,
  ...props
}: ComponentProps<"select"> & {
  id: string;
  etiqueta: ReactNode;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descrito = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {etiqueta}
        {requerido ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
        {requerido ? <span className="visually-hidden">(obligatorio)</span> : null}
      </label>
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-ink-soft">
          {ayuda}
        </p>
      ) : null}
      <select
        id={id}
        aria-describedby={descrito}
        aria-invalid={error ? true : undefined}
        required={requerido}
        className={baseControl}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={idError} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MensajeFormulario({
  tipo,
  children,
}: {
  tipo: "ok" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-medium",
        tipo === "ok" ? "bg-ok-bg text-ok-fg" : "bg-bad-bg text-bad-fg",
      )}
    >
      {tipo === "ok" ? (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  );
}
