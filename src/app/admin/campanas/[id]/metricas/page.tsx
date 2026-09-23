import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { Celda, EncabezadoPagina, Fila, FilaVacia, Tabla } from "@/components/admin/estructura";
import { formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { diasEntre, porcentaje } from "@/lib/aportes";
import { etiquetaMetodo } from "@/lib/pasarela";
import { BarraMeta, BarrasSimples, LineaAcumulado, type PuntoAcumulado } from "@/components/graficas";

export const metadata: Metadata = { title: "Métricas de la campaña" };

export const dynamic = "force-dynamic";

export default async function MetricasCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.DONACIONES_LEER);
  const hoy = new Date();

  const campana = await prisma.campaign.findUnique({
    where: { id },
    include: {
      donaciones: {
        where: { estado: { in: ["COMPLETADA", "PENDIENTE"] } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          monto: true,
          metodo: true,
          estado: true,
          padrinoId: true,
          usuarioId: true,
          donanteNombre: true,
          referenciaPasarela: true,
        },
      },
    },
  });
  if (!campana) notFound();

  const aprobados = campana.donaciones.filter((d) => d.estado === "COMPLETADA");
  const pendientes = campana.donaciones.filter((d) => d.estado === "PENDIENTE");
  const meta = aNumero(campana.meta);
  const recaudado = aprobados.reduce((s, d) => s + aNumero(d.monto ?? 0), 0);
  const falta = Math.max(meta - recaudado, 0);

  const puntos = aprobados.reduce<PuntoAcumulado[]>((lista, d) => {
    const monto = aNumero(d.monto ?? 0);
    const previo = lista[lista.length - 1]?.acumulado ?? 0;
    lista.push({ fecha: d.createdAt, acumulado: previo + monto, monto });
    return lista;
  }, []);

  const diasRestantes = campana.fechaFin ? diasEntre(hoy, campana.fechaFin) : null;
  const semanasRestantes = diasRestantes !== null ? Math.max(diasRestantes / 7, 0) : null;
  const ritmoSemanal =
    semanasRestantes !== null && semanasRestantes > 0 && falta > 0
      ? falta / semanasRestantes
      : null;

  const porMetodo = new Map<string, number>();
  for (const d of aprobados) {
    porMetodo.set(d.metodo, (porMetodo.get(d.metodo) ?? 0) + aNumero(d.monto ?? 0));
  }
  const conCuenta = aprobados.filter((d) => d.padrinoId || d.usuarioId);
  const anonimos = aprobados.filter((d) => !d.padrinoId && !d.usuarioId);

  return (
    <>
      <Link
        href="/admin/campanas"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a campañas
      </Link>

      <EncabezadoPagina
        titulo={`Métricas · ${campana.titulo}`}
        descripcion={
          campana.general
            ? "La campaña general no tiene meta: aquí se ve lo recibido en el tiempo y por método."
            : `Del ${formatFecha(campana.fechaInicio)} al ${formatFecha(campana.fechaFin)}. Todo sale de los aportes aprobados; los pendientes se muestran aparte, sin sumar.`
        }
        acciones={
          campana.eliminadaEn ? (
            <Chip tono="warn">Eliminada el {formatFecha(campana.eliminadaEn)}</Chip>
          ) : campana.activa ? (
            <Chip tono="ok">Activa</Chip>
          ) : (
            <Chip tono="neutro">Cerrada</Chip>
          )
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi etiqueta="Recaudado" valor={formatQuetzales(recaudado)} detalle={`${aprobados.length} aportes aprobados`} />
        {!campana.general ? (
          <Kpi etiqueta="Falta para la meta" valor={formatQuetzales(falta)} detalle={`${porcentaje(recaudado, meta)}% alcanzado`} />
        ) : null}
        {!campana.general ? (
          <Kpi
            etiqueta="Días restantes"
            valor={diasRestantes === null ? "—" : diasRestantes < 0 ? 0 : diasRestantes}
            detalle={
              diasRestantes !== null && diasRestantes < 0
                ? "La fecha límite ya pasó"
                : ritmoSemanal !== null
                  ? `Hacen falta ${formatQuetzales(ritmoSemanal)} por semana`
                  : falta === 0
                    ? "Meta alcanzada"
                    : undefined
            }
          />
        ) : null}
        <Kpi
          etiqueta="Por verificar"
          valor={pendientes.length}
          detalle={pendientes.length > 0 ? "Comprobantes que aún no suman" : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {!campana.general ? (
          <Tarjeta className="p-6 xl:col-span-2">
            <BarraMeta recaudado={recaudado} meta={meta} titulo="Avance contra la meta" />
          </Tarjeta>
        ) : null}

        <Tarjeta className="p-6 xl:col-span-2">
          <LineaAcumulado
            puntos={puntos}
            meta={campana.general ? 0 : meta}
            inicio={campana.fechaInicio}
            limite={campana.general ? null : campana.fechaFin}
            hoy={hoy}
            titulo="Recaudado en el tiempo (acumulado)"
          />
          <p className="medida-lectura mt-3 text-xs text-ink-soft">
            Cada punto es un aporte aprobado el día en que se registró. Pasa el
            puntero por un punto para ver el monto.
          </p>
        </Tarjeta>

        <Tarjeta className="p-6">
          <BarrasSimples
            titulo="Por método"
            datos={[...porMetodo.entries()].map(([metodo, valor]) => ({
              etiqueta: etiquetaMetodo(metodo),
              valor,
            }))}
          />
        </Tarjeta>

        <Tarjeta className="p-6">
          <BarrasSimples
            titulo="Aportes por origen"
            formato={(v) => String(v)}
            datos={[
              {
                etiqueta: "Con cuenta",
                valor: conCuenta.length,
                detalle: "Padrinos y familias con sesión",
              },
              { etiqueta: "Anónimos", valor: anonimos.length, detalle: "Desde la portada, sin sesión" },
              { etiqueta: "Por verificar", valor: pendientes.length },
            ]}
          />
        </Tarjeta>
      </div>

      <Tarjeta className="mt-8 overflow-hidden">
        <TarjetaCabecera titulo="Los mismos números, en tabla" descripcion="Aportes aprobados de esta campaña, del más reciente al más antiguo." />
        <Tabla caption="Aportes aprobados de la campaña" columnas={["Fecha", "Referencia", "De parte de", "Método", "Monto", "Acumulado"]}>
          {puntos.length === 0 ? (
            <FilaVacia columnas={6} mensaje="Todavía no hay aportes aprobados." />
          ) : (
            [...aprobados].reverse().map((d, i) => (
              <Fila key={d.id}>
                <Celda className="whitespace-nowrap">{formatFecha(d.createdAt)}</Celda>
                <Celda className="font-mono text-xs">
                  <Link href={`/admin/donaciones/${d.id}`} className="text-brand-dark hover:underline">
                    {d.referenciaPasarela}
                  </Link>
                </Celda>
                <Celda>{d.donanteNombre ?? "Sin identificar"}</Celda>
                <Celda>{etiquetaMetodo(d.metodo)}</Celda>
                <Celda className="whitespace-nowrap">{formatQuetzales(aNumero(d.monto ?? 0))}</Celda>
                <Celda className="whitespace-nowrap">
                  {formatQuetzales(puntos[puntos.length - 1 - i].acumulado)}
                </Celda>
              </Fila>
            ))
          )}
        </Tabla>
      </Tarjeta>
    </>
  );
}
