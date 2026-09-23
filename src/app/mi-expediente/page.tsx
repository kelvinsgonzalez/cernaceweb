import type { Metadata } from "next";
import Image from "next/image";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  MessageCircleHeart,
  ShieldCheck,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { AvisoCampanas } from "@/components/aviso-campanas";
import { FotoBeneficiario } from "@/components/foto-beneficiario";
import { calcularEdad, formatFecha, formatFechaHora } from "@/lib/fechas";
import { formatTamano, listarTerapias, primerNombre, urlFotoBeneficiario } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi expediente" };

export const dynamic = "force-dynamic";

export default async function MiExpedientePage() {
  const usuario = await requirePermiso(PERMISOS.PORTAL_BENEFICIARIO);

  // La consulta parte del expediente de la sesión, nunca de un id de la URL:
  // esta página no acepta parámetros precisamente por eso.
  const beneficiario = usuario.beneficiarioId
    ? await prisma.beneficiario.findUnique({
        where: { id: usuario.beneficiarioId },
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          codigoExpediente: true,
          fechaNacimiento: true,
          fechaIngreso: true,
          fotoArchivo: true,
          terapias: {
            orderBy: { orden: "asc" },
            select: { id: true, nombre: true, detalle: true },
          },
          // Del plan solo el objetivo: las anotaciones son indicaciones
          // internas para el equipo y no salen de él.
          plan: { select: { activo: true, objetivoGeneral: true } },
          citas: {
            where: { fecha: { gte: new Date() } },
            orderBy: { fecha: "asc" },
            take: 1,
            select: { fecha: true, tipo: true },
          },
          seguimientos: {
            where: { visibleParaPadrino: true },
            orderBy: { fecha: "desc" },
            select: {
              id: true,
              fecha: true,
              area: true,
              titulo: true,
              descripcion: true,
              fotos: { select: { id: true } },
            },
          },
          documentos: {
            where: { visibleParaPadrino: true, archivo: { not: null } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              nombre: true,
              categoria: true,
              tamanoBytes: true,
              createdAt: true,
            },
          },
        },
      })
    : null;

  if (!beneficiario) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
          Hola, {usuario.nombre.split(" ")[0]}
        </h1>
        <Tarjeta className="mt-6">
          <Vacio mensaje="Tu cuenta todavía no está vinculada a un expediente. El equipo de CERNACE lo hace desde el panel; avísales si crees que es un error." />
        </Tarjeta>
      </div>
    );
  }

  const nombre = primerNombre(beneficiario.nombres);
  const proximaCita = beneficiario.citas[0];

  // Las palabras del padrino: solo las de aportes aprobados que el
  // administrador decidió publicar. Nunca el monto.
  const mensajes = await prisma.donacion.findMany({
    where: {
      beneficiarioId: beneficiario.id,
      estado: "COMPLETADA",
      mensajeVisibleFamilia: true,
      mensaje: { not: null },
    },
    orderBy: { verificadaEn: "desc" },
    select: {
      id: true,
      mensaje: true,
      verificadaEn: true,
      createdAt: true,
      padrino: { select: { nombre: true } },
    },
  });

  await registrarAuditoria({
    actor: usuario.email,
    accion: "VER_EXPEDIENTE_PROPIO",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Consulta del expediente ${beneficiario.codigoExpediente} desde la cuenta de la familia`,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <AvisoCampanas className="mb-6" />

      <Tarjeta className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <FotoBeneficiario
            nombre={nombre}
            fotoUrl={urlFotoBeneficiario(
              beneficiario.id,
              beneficiario.fotoArchivo,
            )}
            tamano={96}
          />
          <div>
            <p className="font-mono text-xs text-ink-soft">
              {beneficiario.codigoExpediente}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
              {beneficiario.nombres} {beneficiario.apellidos}
            </h1>
            <p className="mt-1 inline-flex items-center gap-2 text-brand-primary">
              <HeartPulse aria-hidden="true" className="size-4 shrink-0" />
              {listarTerapias(beneficiario.terapias)}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Edad
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {calcularEdad(beneficiario.fechaNacimiento)} años
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              En CERNACE desde
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatFecha(beneficiario.fechaIngreso)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Próxima cita
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {proximaCita
                ? `${formatFechaHora(proximaCita.fecha)} · ${proximaCita.tipo}`
                : "Sin cita programada"}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      {beneficiario.plan?.activo ? (
        <Tarjeta className="mt-6 p-6">
          <h2 className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Target aria-hidden="true" className="size-5 text-brand-primary" />
            Objetivo del tratamiento
          </h2>
          <p className="medida-lectura mt-2 text-sm text-ink">
            {beneficiario.plan.objetivoGeneral}
          </p>
        </Tarjeta>
      ) : null}

      {mensajes.length > 0 ? (
        <section aria-labelledby="mensajes-titulo" className="mt-10">
          <h2
            id="mensajes-titulo"
            className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-ink"
          >
            <MessageCircleHeart aria-hidden="true" className="size-6 text-brand-primary" />
            Mensajes de tu padrino
          </h2>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            Palabras que {nombre} recibe de quien lo apadrina, con cada aporte.
          </p>
          <ol className="mt-5 space-y-4">
            {mensajes.map((m) => (
              <li key={m.id}>
                <Tarjeta className="bg-brand-sky p-6">
                  <blockquote className="medida-lectura font-heading text-lg text-brand-dark">
                    «{m.mensaje}»
                  </blockquote>
                  <p className="mt-3 text-sm text-ink-soft">
                    — {m.padrino?.nombre ?? "Tu padrino"} ·{" "}
                    {formatFecha(m.verificadaEn ?? m.createdAt)}
                  </p>
                </Tarjeta>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="avances-titulo" className="mt-10">
        <h2 id="avances-titulo" className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Avances
        </h2>
        <p className="medida-lectura mt-2 text-sm text-ink-soft">
          Lo que el equipo ha decidido compartir sobre el trabajo de estos meses.
        </p>

        {beneficiario.seguimientos.length === 0 ? (
          <Tarjeta className="mt-5">
            <Vacio mensaje="Todavía no hay avances compartidos. En cuanto el equipo publique uno, aparecerá aquí." />
          </Tarjeta>
        ) : (
          <ol className="mt-5 space-y-4">
            {beneficiario.seguimientos.map((avance) => (
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
                              sin la sesión y recibiría un 404. */}
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

        {beneficiario.documentos.length === 0 ? (
          <Tarjeta className="mt-5">
            <Vacio mensaje="Todavía no se ha compartido ningún documento." />
          </Tarjeta>
        ) : (
          <Tarjeta className="mt-5">
            <ul className="divide-y divide-line">
              {beneficiario.documentos.map((documento) => (
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

      <div className="mt-10 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-5">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-dark"
        />
        <p className="medida-lectura text-sm text-brand-dark">
          Esta página es de consulta. Si algún dato del expediente está
          equivocado o quieres pedir una copia de algo que no aparece aquí,
          háblalo con trabajo social: los cambios los hace el equipo.
        </p>
      </div>
    </div>
  );
}
