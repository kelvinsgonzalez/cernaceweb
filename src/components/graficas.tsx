import { formatQuetzales } from "@/lib/fechas";

/**
 * Gráficas en SVG propio, sin librerías. Una sola serie por gráfica, así que
 * el color es el de la marca y la identidad la lleva el título. Marcas finas,
 * extremos redondeados, rejilla discreta y el texto siempre en tinta, nunca
 * en el color de la serie. Cada marca lleva su <title> para leerse al pasar
 * el puntero, y debajo de cada gráfica va la tabla con los mismos números.
 */

const ANCHO = 640;
const ALTO = 240;
const MARGEN = { arriba: 16, derecha: 16, abajo: 32, izquierda: 64 };

function escala(dominio: [number, number], rango: [number, number]) {
  const [d0, d1] = dominio;
  const [r0, r1] = rango;
  const ancho = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / ancho) * (r1 - r0);
}

function formatoCorto(valor: number): string {
  if (valor >= 1000) return `Q${Math.round(valor / 1000)}k`;
  return `Q${Math.round(valor)}`;
}

function fechaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short" }).format(fecha);
}

/** Lo recaudado sobre la meta: una barra horizontal con la meta al final. */
export function BarraMeta({
  recaudado,
  meta,
  titulo,
}: {
  recaudado: number;
  meta: number;
  titulo: string;
}) {
  const tope = Math.max(meta, recaudado, 1);
  const ancho = 640;
  const x = escala([0, tope], [0, ancho]);
  const porcentaje = meta > 0 ? Math.round((recaudado / meta) * 100) : 0;
  return (
    <figure>
      <figcaption className="text-sm font-medium text-ink-soft">{titulo}</figcaption>
      <svg
        viewBox={`0 0 ${ancho} 48`}
        role="img"
        aria-label={`${formatQuetzales(recaudado)} de ${formatQuetzales(meta)}, ${porcentaje} por ciento`}
        className="mt-2 h-12 w-full"
      >
        <rect x={0} y={14} width={ancho} height={12} rx={6} fill="var(--color-brand-sky)" />
        <rect
          x={0}
          y={14}
          width={Math.max(x(recaudado), recaudado > 0 ? 12 : 0)}
          height={12}
          rx={6}
          fill="var(--color-brand-primary)"
        >
          <title>{`Recaudado: ${formatQuetzales(recaudado)}`}</title>
        </rect>
        {meta > 0 && meta <= tope ? (
          <line
            x1={x(meta)}
            x2={x(meta)}
            y1={8}
            y2={32}
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeDasharray="3 3"
          >
            <title>{`Meta: ${formatQuetzales(meta)}`}</title>
          </line>
        ) : null}
        <text x={0} y={44} fontSize={11} fill="var(--color-ink-soft)">
          {formatQuetzales(recaudado)} recaudado
        </text>
        <text x={ancho} y={44} fontSize={11} textAnchor="end" fill="var(--color-ink-soft)">
          meta {formatQuetzales(meta)} · {porcentaje}%
        </text>
      </svg>
    </figure>
  );
}

export type PuntoAcumulado = { fecha: Date; acumulado: number; monto: number };

/** El acumulado día a día desde el inicio, con la meta y la fecha límite. */
export function LineaAcumulado({
  puntos,
  meta,
  inicio,
  limite,
  hoy,
  titulo,
}: {
  puntos: PuntoAcumulado[];
  meta: number;
  inicio: Date;
  limite: Date | null;
  hoy: Date;
  titulo: string;
}) {
  const finX = new Date(Math.max(hoy.getTime(), limite?.getTime() ?? 0));
  const x = escala(
    [inicio.getTime(), finX.getTime()],
    [MARGEN.izquierda, ANCHO - MARGEN.derecha],
  );
  const topeY = Math.max(meta, ...puntos.map((p) => p.acumulado), 1) * 1.08;
  const y = escala([0, topeY], [ALTO - MARGEN.abajo, MARGEN.arriba]);

  // La línea arranca en cero al inicio y llega hasta hoy con el último valor.
  const ultimo = puntos[puntos.length - 1]?.acumulado ?? 0;
  const camino = [
    `${x(inicio.getTime())},${y(0)}`,
    ...puntos.map((p) => `${x(p.fecha.getTime())},${y(p.acumulado)}`),
    `${x(hoy.getTime())},${y(ultimo)}`,
  ].join(" ");

  const rejilla = [0.25, 0.5, 0.75, 1].map((f) => topeY * f);

  return (
    <figure>
      <figcaption className="text-sm font-medium text-ink-soft">{titulo}</figcaption>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Recaudado acumulado desde ${fechaCorta(inicio)}: ${formatQuetzales(ultimo)} de una meta de ${formatQuetzales(meta)}`}
        className="mt-2 h-auto w-full"
      >
        {rejilla.map((v) => (
          <g key={v}>
            <line
              x1={MARGEN.izquierda}
              x2={ANCHO - MARGEN.derecha}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={MARGEN.izquierda - 8}
              y={y(v) + 4}
              fontSize={11}
              textAnchor="end"
              fill="var(--color-ink-soft)"
            >
              {formatoCorto(v)}
            </text>
          </g>
        ))}
        <line
          x1={MARGEN.izquierda}
          x2={ANCHO - MARGEN.derecha}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--color-line)"
          strokeWidth={1}
        />

        {meta > 0 ? (
          <g>
            <line
              x1={MARGEN.izquierda}
              x2={ANCHO - MARGEN.derecha}
              y1={y(meta)}
              y2={y(meta)}
              stroke="var(--color-ink)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text
              x={ANCHO - MARGEN.derecha}
              y={y(meta) - 6}
              fontSize={11}
              textAnchor="end"
              fill="var(--color-ink)"
            >
              Meta {formatQuetzales(meta)}
            </text>
          </g>
        ) : null}

        {limite ? (
          <g>
            <line
              x1={x(limite.getTime())}
              x2={x(limite.getTime())}
              y1={MARGEN.arriba}
              y2={ALTO - MARGEN.abajo}
              stroke="var(--color-ink-soft)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <text
              x={x(limite.getTime())}
              y={ALTO - 10}
              fontSize={11}
              textAnchor="end"
              fill="var(--color-ink-soft)"
            >
              límite {fechaCorta(limite)}
            </text>
          </g>
        ) : null}

        <polyline
          points={camino}
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {puntos.map((p, i) => (
          <circle
            key={i}
            cx={x(p.fecha.getTime())}
            cy={y(p.acumulado)}
            r={4}
            fill="var(--color-brand-primary)"
            stroke="var(--color-surface, #fff)"
            strokeWidth={2}
          >
            <title>{`${fechaCorta(p.fecha)}: +${formatQuetzales(p.monto)} · acumulado ${formatQuetzales(p.acumulado)}`}</title>
          </circle>
        ))}

        <text
          x={MARGEN.izquierda}
          y={ALTO - 10}
          fontSize={11}
          fill="var(--color-ink-soft)"
        >
          {fechaCorta(inicio)}
        </text>
        <text
          x={x(hoy.getTime())}
          y={ALTO - 10}
          fontSize={11}
          textAnchor={limite && limite > hoy ? "middle" : "end"}
          fill="var(--color-ink-soft)"
        >
          hoy
        </text>
      </svg>
    </figure>
  );
}

export type BarraDato = { etiqueta: string; valor: number; detalle?: string };

/** Unas pocas categorías de una misma medida: barras verticales finas. */
export function BarrasSimples({
  datos,
  titulo,
  formato = formatQuetzales,
}: {
  datos: BarraDato[];
  titulo: string;
  formato?: (v: number) => string;
}) {
  const tope = Math.max(...datos.map((d) => d.valor), 1) * 1.15;
  const y = escala([0, tope], [ALTO - MARGEN.abajo, MARGEN.arriba]);
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const paso = anchoUtil / Math.max(datos.length, 1);
  const anchoBarra = Math.min(48, paso * 0.5);
  const base = ALTO - MARGEN.abajo;

  return (
    <figure>
      <figcaption className="text-sm font-medium text-ink-soft">{titulo}</figcaption>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`${titulo}: ${datos.map((d) => `${d.etiqueta} ${formato(d.valor)}`).join(", ")}`}
        className="mt-2 h-auto w-full"
      >
        <line
          x1={MARGEN.izquierda}
          x2={ANCHO - MARGEN.derecha}
          y1={base}
          y2={base}
          stroke="var(--color-line)"
          strokeWidth={1}
        />
        {datos.map((d, i) => {
          const cx = MARGEN.izquierda + paso * i + paso / 2;
          const x0 = cx - anchoBarra / 2;
          const alto = Math.max(base - y(d.valor), d.valor > 0 ? 4 : 0);
          const r = Math.min(4, anchoBarra / 2, alto);
          // Extremo superior redondeado, base recta sobre el eje.
          const camino = `M${x0},${base} v${-(alto - r)} a${r},${r} 0 0 1 ${r},${-r} h${anchoBarra - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${alto - r} z`;
          return (
            <g key={d.etiqueta}>
              <path d={camino} fill="var(--color-brand-primary)">
                <title>{`${d.etiqueta}: ${formato(d.valor)}${d.detalle ? ` · ${d.detalle}` : ""}`}</title>
              </path>
              <text
                x={cx}
                y={base - alto - 6}
                fontSize={11}
                textAnchor="middle"
                fill="var(--color-ink)"
              >
                {formato(d.valor)}
              </text>
              <text
                x={cx}
                y={ALTO - 10}
                fontSize={11}
                textAnchor="middle"
                fill="var(--color-ink-soft)"
              >
                {d.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
