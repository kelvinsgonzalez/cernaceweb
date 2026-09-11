import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { calcularEdad, formatFecha, formatQuetzales } from "@/lib/fechas";
import { aNumero, formatTamano, primerNombre } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProgresoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  // El padrinazgo debe ser de este padrino: un id ajeno en la URL no devuelve nada.
  const padrinazgo = usuario.padrinoId
    ? await prisma.padrinazgo.findFirst({
        where: {
          beneficiarioId: id,
          padrinoId: usuario.padrinoId,
          activo: true,
        },
        include: {
          beneficiario: {
            select: {
              id: true,
              nombres: true,
              fechaNacimiento: true,
              fechaIngreso: true,
              programa: { select: { nombre: true, descripcion: true, icono: true } },
              seguimientos: {
                where: { visibleParaPadrino: true },
                orderBy: { fecha: "desc" },
                select: {
                  id: true,
                  fecha: true,
                  area: true,
                  titulo: true,
                  descripcion: true,
                  // El nombre de quien lo escribió no se trae: el padrino ve el
                  // avance y su área, no la ficha del personal.
                  fotos: { select: { id: true } },
                },
              },
              // Solo los que el equipo marcó como compartidos y tienen archivo:
              // el resto del expediente no se consulta siquiera.
              documentos: {
                where: { visibleParaPadrino: true, archivo: { not: null } },
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  nombre: true,
                  categoria: true,
                  tipoMime: true,
                  tamanoBytes: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      })
    : null;

  if (!padrinazgo) notFound();

  const nino = padrinazgo.beneficiario;
  const nombre = primerNombre(nino.nombres);

  await registrarAuditoria({
    actor: usuario.email,
    accion: "VER_PORTAL",
    entidad: "Padrinazgo",
    entidadId: padrinazgo.id,
    detalle: `Consulta del progreso de ${nombre} desde el portal del padrino`,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a mis apadrinados
      </Link>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <span
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-brand-yellow font-heading text-2xl font-semibold tracking-tight text-brand-dark"
          >
            {nombre[0]}
          </span>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
              {nombre}, {calcularEdad(nino.fechaNacimiento)} años
            </h1>
            <p className="mt-1 inline-flex items-center gap-2 text-brand-primary">
              <IconoPrograma nombre={nino.programa.icono} className="size-4" />
              {nino.programa.nombre}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              En CERNACE desde
            </dt>
            <dd className="mt-1 text-sm text-ink">{formatFecha(nino.fechaIngreso)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Tu aporte mensual
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatQuetzales(aNumero(padrinazgo.aporteMensual))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Apadrinas desde
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatFecha(padrinazgo.fechaInicio)}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      <section aria-labelledby="avances-titulo" className="mt-8">
        <h2 id="avances-titulo" className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Avances publicados
        </h2>
        <p className="medida-lectura mt-2 text-sm text-ink-soft">
          Los terapeutas que atienden a tu apadrinado publican aquí sus
          reseñas, con fotos cuando las hay. El personal decide qué avances se
          comparten contigo: las notas internas no aparecen.
        </p>

        {nino.seguimientos.length === 0 ? (
          <Tarjeta className="mt-5">
            <Vacio mensaje="Todavía no hay avances publicados. En cuanto el equipo registre uno, aparecerá en esta página." />
          </Tarjeta>
        ) : (
          <ol className="mt-5 space-y-4">
            {nino.seguimientos.map((avance) => (
              <li key={avance.id}>
                <Tarjeta className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Chip
                      tono="info"
                      icono={<CalendarDays aria-hidden="true" className="size-4" />}
                    >
                      {formatFecha(avance.fecha)}
                    </Chip>
                    <Chip tono="neutro">{avance.area}</Chip>
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-semibold text-ink">
                    {avance.titulo}
                  </h3>
                  <p className="medida-lectura mt-2 text-sm text-ink-soft">
                    {avance.descripcion}
                  </p>
                  {avance.fotos.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {avance.fotos.map((foto) => (
                        <li key={foto.id}>
                          {/* Sin optimizar: el optimizador pediría la imagen
                              sin la sesión del padrino y recibiría un 404. */}
                          <Image
                            src={`/api/fotos/${foto.id}`}
                            alt=""
                            width={400}
                            height={400}
                            unoptimized
                            className="aspect-square w-full rounded-[var(--radius-sm)] border border-line object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Tarjeta>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="documentos-titulo" className="mt-10">
        <h2
          id="documentos-titulo"
          className="font-heading text-2xl font-semibold tracking-tight text-ink"
        >
          Documentos compartidos
        </h2>
        <p className="medida-lectura mt-2 text-sm text-ink-soft">
          Informes y constancias que el equipo ha decidido compartir contigo. El
          resto del expediente es confidencial y no aparece aquí.
        </p>

        {nino.documentos.length === 0 ? (
          <Tarjeta className="mt-5">
            <Vacio mensaje="Todavía no se ha compartido ningún documento." />
          </Tarjeta>
        ) : (
          <Tarjeta className="mt-5">
            <ul className="divide-y divide-line">
              {nino.documentos.map((documento) => (
                <li
                  key={documento.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <a
                      href={`/api/documentos/${documento.id}`}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {documento.nombre}
                      <span className="visually-hidden">
                        {" "}
                        (se abre en una pestaña nueva)
                      </span>
                    </a>
                    <span className="block text-xs text-ink-soft">
                      {documento.categoria} · {formatTamano(documento.tamanoBytes)} ·{" "}
                      {formatFecha(documento.createdAt)}
                    </span>
                  </div>
                  <FileText aria-hidden="true" className="size-5 text-ink-soft" />
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
      </section>

      <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-5">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-dark"
        />
        <p className="medida-lectura text-sm text-brand-dark">
          Como padrino ves el nombre, la edad, el programa, los avances
          publicados y los documentos que el equipo comparte contigo. El diagnóstico, la ficha socioeconómica y los datos de la
          familia son confidenciales y no se comparten.
        </p>
      </div>
    </div>
  );
}
