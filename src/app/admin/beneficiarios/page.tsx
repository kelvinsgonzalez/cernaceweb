import type { Metadata } from "next";
import Link from "next/link";
import { Filter, FilePlus2, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  Boton,
  Chip,
  ChipEstadoBeneficiario,
  ChipEstadoExpediente,
  EnlaceBoton,
  Tarjeta,
} from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { calcularEdad, formatFecha } from "@/lib/fechas";
import {
  fechaLimiteSinTerapia,
  filtroSinTerapiaReciente,
  mesesSinTerapia,
  sinTerapiaReciente,
} from "@/lib/alertas";
import {
  ResumenBeneficiarios,
  type ClaveAlerta,
  type FilaResumen,
} from "./resumen";

export const metadata: Metadata = { title: "Beneficiarios" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Expediente",
  "Nombre",
  "Edad",
  "Última terapia",
  "Centro",
  "Padrino",
  "Estado",
  "Expediente",
  "",
];

const CLAVES_ALERTA: ClaveAlerta[] = [
  "con-padrino",
  "sin-padrino",
  "incompletos",
  "sin-terapia",
  "sin-equipo",
  "mis-casos",
];

function esClaveAlerta(valor: string | undefined): valor is ClaveAlerta {
  return CLAVES_ALERTA.includes(valor as ClaveAlerta);
}

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    alerta?: string;
  }>;
}) {
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_LEER);
  const puedeAbrir = tienePermiso(usuario, PERMISOS.EXPEDIENTE_ESCRIBIR);
  const { q, estado, alerta } = await searchParams;

  const busqueda = q?.trim() ?? "";
  const alertaActiva = esClaveAlerta(alerta) ? alerta : null;

  const meses = await mesesSinTerapia();
  const limite = fechaLimiteSinTerapia(meses);

  // Cada fila del resumen es también un filtro: la misma condición sirve para
  // contar y para listar, así el número y la tabla no se contradicen.
  const filtrosAlerta: Record<ClaveAlerta, object> = {
    "con-padrino": { padrinazgos: { some: { activo: true } } },
    "sin-padrino": { padrinazgos: { none: { activo: true } } },
    incompletos: { estadoExpediente: { not: "COMPLETO" } },
    "sin-terapia": filtroSinTerapiaReciente(limite),
    // Aprobados para terapia pero sin nadie que les registre avances.
    "sin-equipo": {
      estado: "ACTIVO",
      plan: { is: { activo: true } },
      responsables: { none: { activo: true } },
    },
    // Los niños de los que la persona con sesión es responsable.
    "mis-casos": {
      responsables: { some: { terapeutaId: usuario.id, activo: true } },
    },
  };

  const filtros = {
    ...(busqueda
      ? {
          OR: [
            { nombres: { contains: busqueda, mode: "insensitive" as const } },
            { apellidos: { contains: busqueda, mode: "insensitive" as const } },
            {
              codigoExpediente: {
                contains: busqueda,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(estado
      ? { estado: estado as "ACTIVO" | "INACTIVO" | "EGRESADO" }
      : {}),
    ...(alertaActiva ? filtrosAlerta[alertaActiva] : {}),
  };

  const [
    total,
    conPadrino,
    sinPadrino,
    incompletos,
    sinTerapia,
    sinEquipo,
    misCasos,
    beneficiarios,
  ] = await Promise.all([
    prisma.beneficiario.count(),
    prisma.beneficiario.count({ where: filtrosAlerta["con-padrino"] }),
    prisma.beneficiario.count({ where: filtrosAlerta["sin-padrino"] }),
    prisma.beneficiario.count({ where: filtrosAlerta.incompletos }),
    prisma.beneficiario.count({ where: filtrosAlerta["sin-terapia"] }),
    prisma.beneficiario.count({ where: filtrosAlerta["sin-equipo"] }),
    prisma.beneficiario.count({ where: filtrosAlerta["mis-casos"] }),
    prisma.beneficiario.findMany({
      where: filtros,
      orderBy: { codigoExpediente: "asc" },
      include: {
        padrinazgos: {
          where: { activo: true },
          select: { padrino: { select: { nombre: true } } },
        },
        // El último avance es la evidencia de la última terapia recibida.
        seguimientos: {
          orderBy: { fecha: "desc" },
          take: 1,
          select: { fecha: true },
        },
      },
    }),
  ]);

  const filasResumen: FilaResumen[] = [
    { clave: null, etiqueta: "Total", valor: total },
    { clave: "con-padrino", etiqueta: "Con padrino", valor: conPadrino },
    {
      clave: "sin-padrino",
      etiqueta: "Sin padrino",
      valor: sinPadrino,
      tono: "aviso",
    },
    {
      clave: "incompletos",
      etiqueta: "Expedientes incompletos",
      detalle: "En revisión o incompletos.",
      valor: incompletos,
      tono: "aviso",
    },
    {
      clave: "sin-terapia",
      etiqueta: `Sin terapia en ${meses} meses`,
      detalle: `Activos inscritos antes del ${formatFecha(limite)} y sin ningún avance desde entonces.`,
      valor: sinTerapia,
      tono: "aviso",
    },
    {
      clave: "sin-equipo",
      etiqueta: "Aprobados sin equipo",
      detalle: "Con plan de terapia activo y ningún responsable asignado.",
      valor: sinEquipo,
      tono: "aviso",
    },
    // La fila solo aparece a quien lleva casos: para el resto sería un cero.
    ...(misCasos > 0 || alertaActiva === "mis-casos"
      ? [
          {
            clave: "mis-casos" as const,
            etiqueta: "Mis casos",
            detalle: "Los niños de los que eres responsable.",
            valor: misCasos,
          },
        ]
      : []),
  ];

  const etiquetaAlerta = filasResumen.find((f) => f.clave === alertaActiva);
  const hayFiltros = Boolean(busqueda || estado || alertaActiva);

  return (
    <>
      <EncabezadoPagina
        titulo="Beneficiarios"
        descripcion="Expedientes digitalizados y centralizados. Cada apertura queda registrada en la bitácora."
        acciones={
          <div className="flex flex-wrap items-center gap-2">
            <ResumenBeneficiarios filas={filasResumen} activa={alertaActiva} />
            {puedeAbrir ? (
              <EnlaceBoton href="/admin/beneficiarios/nuevo">
                <FilePlus2 aria-hidden="true" className="size-4" />
                Nuevo expediente
              </EnlaceBoton>
            ) : null}
          </div>
        }
      />

      {/* Filtros con formulario GET: funcionan sin JavaScript. */}
      <Tarjeta className="p-5">
        <form method="get" className="flex flex-wrap items-end gap-4">
          {/* El filtro del resumen se conserva al buscar o filtrar por estado. */}
          {alertaActiva ? (
            <input type="hidden" name="alerta" value={alertaActiva} />
          ) : null}
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-sm font-semibold text-ink">
              Buscar
            </label>
            <p id="q-ayuda" className="text-xs text-ink-soft">
              Por nombre, apellido o código de expediente.
            </p>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={busqueda}
              aria-describedby="q-ayuda"
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="estado" className="text-sm font-semibold text-ink">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="EGRESADO">Egresado</option>
            </select>
          </div>

          <Boton type="submit" variante="contorno">
            <Filter aria-hidden="true" className="size-4" />
            Filtrar
          </Boton>
          {hayFiltros ? (
            <EnlaceBoton href="/admin/beneficiarios" variante="suave">
              Limpiar
            </EnlaceBoton>
          ) : null}
        </form>
      </Tarjeta>

      <div
        className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft"
        role="status"
      >
        <span className="inline-flex items-center gap-2">
          <Search aria-hidden="true" className="size-4" />
          {beneficiarios.length}{" "}
          {beneficiarios.length === 1
            ? "expediente encontrado"
            : "expedientes encontrados"}
        </span>
        {etiquetaAlerta ? (
          <Chip tono={etiquetaAlerta.tono === "aviso" ? "warn" : "info"}>
            Filtro: {etiquetaAlerta.etiqueta}
          </Chip>
        ) : null}
      </div>

      <div className="mt-3">
        <Tabla
          caption="Listado de beneficiarios con su última terapia, centro de atención, padrino asignado y estado del expediente"
          columnas={COLUMNAS}
        >
          {beneficiarios.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="Ningún expediente coincide con los filtros aplicados."
            />
          ) : (
            beneficiarios.map((b) => {
              const nombreCompleto = `${b.nombres} ${b.apellidos}`;
              const padrino = b.padrinazgos[0]?.padrino.nombre;
              const ultimoAvance = b.seguimientos[0]?.fecha ?? null;
              const enAlerta = sinTerapiaReciente(b, ultimoAvance, limite);
              return (
                <Fila key={b.id}>
                  <Celda className="font-mono text-xs">{b.codigoExpediente}</Celda>
                  <Celda>
                    <span className="font-medium">{nombreCompleto}</span>
                  </Celda>
                  <Celda>{calcularEdad(b.fechaNacimiento)} años</Celda>
                  <Celda>
                    {/* La última terapia es el último avance registrado. */}
                    {ultimoAvance ? (
                      <span
                        className={
                          enAlerta ? "font-medium text-warn-fg" : undefined
                        }
                      >
                        {formatFecha(ultimoAvance)}
                      </span>
                    ) : (
                      <span
                        className={
                          enAlerta ? "font-medium text-warn-fg" : "text-ink-soft"
                        }
                      >
                        Sin avances
                      </span>
                    )}
                    {enAlerta ? (
                      <span className="block text-xs text-warn-fg">
                        Más de {meses} meses
                      </span>
                    ) : null}
                  </Celda>
                  <Celda>{b.centroAtencion}</Celda>
                  <Celda>
                    {padrino ?? (
                      <span className="text-ink-soft">Sin asignar</span>
                    )}
                  </Celda>
                  <Celda>
                    <ChipEstadoBeneficiario estado={b.estado} />
                  </Celda>
                  <Celda>
                    <ChipEstadoExpediente estado={b.estadoExpediente} />
                  </Celda>
                  <Celda>
                    <Link
                      href={`/admin/beneficiarios/${b.id}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Ver expediente
                      <span className="visually-hidden"> de {nombreCompleto}</span>
                    </Link>
                  </Celda>
                </Fila>
              );
            })
          )}
        </Tabla>
      </div>
    </>
  );
}
