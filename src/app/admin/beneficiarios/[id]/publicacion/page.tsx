import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { FotoBeneficiario } from "@/components/foto-beneficiario";
import { calcularEdad } from "@/lib/fechas";
import { primerNombre, urlFotoBeneficiario, listarTerapias } from "@/lib/utils";
import { FormularioPublicacion } from "./formulario";
import { guardarPublicacion } from "../../acciones";

export const metadata: Metadata = { title: "Publicación" };

export const dynamic = "force-dynamic";

export default async function PublicacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.GALERIA_PUBLICAR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      fechaNacimiento: true,
      estado: true,
      solicitaPatrocinio: true,
      publicadoEnGaleria: true,
      resumenPublico: true,
      fotoArchivo: true,
      terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
      plan: { select: { activo: true } },
      padrinazgos: {
        where: { activo: true },
        select: { padrino: { select: { nombre: true } } },
      },
    },
  });

  if (!beneficiario) notFound();

  const nombre = primerNombre(beneficiario.nombres);
  const padrino = beneficiario.padrinazgos[0]?.padrino.nombre;
  const visible =
    beneficiario.estado === "ACTIVO" &&
    beneficiario.solicitaPatrocinio &&
    beneficiario.publicadoEnGaleria &&
    !padrino;

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Publicación en el sitio público"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          visible ? (
            <Chip tono="ok">Visible en la página pública</Chip>
          ) : (
            <Chip tono="neutro">No aparece en la página pública</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta>
          <TarjetaCabecera
            titulo="Qué se publica"
            descripcion="La foto y el resumen que verán quienes busquen a quién patrocinar."
            icono={<Eye className="size-5" />}
          />
          <div className="p-5">
            <FormularioPublicacion
              accion={guardarPublicacion}
              id={beneficiario.id}
              resumenPublico={beneficiario.resumenPublico ?? ""}
              publicado={beneficiario.publicadoEnGaleria}
              tieneFoto={Boolean(beneficiario.fotoArchivo)}
              puedePublicar={beneficiario.solicitaPatrocinio}
            />
          </div>
        </Tarjeta>

        <aside className="space-y-6">
          <Tarjeta>
            <TarjetaCabecera titulo="Cómo se ve ahora" />
            <div className="flex flex-col items-center gap-3 p-5">
              <FotoBeneficiario
                nombre={nombre}
                fotoUrl={urlFotoBeneficiario(
                  beneficiario.id,
                  beneficiario.fotoArchivo,
                )}
                tamano={128}
                sinOptimizar
              />
              <p className="font-heading text-lg font-semibold text-ink">
                {nombre}, {calcularEdad(beneficiario.fechaNacimiento)} años
              </p>
              <p className="text-sm text-brand-primary">
                {listarTerapias(beneficiario.terapias)}
              </p>
              {beneficiario.resumenPublico ? (
                <p className="medida-lectura text-center text-sm text-ink-soft">
                  {beneficiario.resumenPublico}
                </p>
              ) : null}
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera titulo="Las tres condiciones" />
            <ul className="divide-y divide-line text-sm">
              <li className="flex items-start justify-between gap-3 px-5 py-3">
                <span className="text-ink">La familia pidió patrocinador</span>
                {beneficiario.solicitaPatrocinio ? (
                  <Chip tono="ok">Sí</Chip>
                ) : (
                  <Chip tono="bad">No</Chip>
                )}
              </li>
              <li className="flex items-start justify-between gap-3 px-5 py-3">
                <span className="text-ink">La administración lo autorizó</span>
                {beneficiario.publicadoEnGaleria ? (
                  <Chip tono="ok">Sí</Chip>
                ) : (
                  <Chip tono="bad">No</Chip>
                )}
              </li>
              <li className="flex items-start justify-between gap-3 px-5 py-3">
                <span className="text-ink">Todavía no tiene padrino</span>
                {padrino ? (
                  <Chip tono="neutro">{padrino}</Chip>
                ) : (
                  <Chip tono="ok">Sí</Chip>
                )}
              </li>
            </ul>
            <p className="medida-lectura border-t border-line px-5 py-4 text-xs text-ink-soft">
              Nada de esto afecta a la terapia:{" "}
              {beneficiario.plan?.activo
                ? "su plan está aprobado y el equipo sigue atendiéndolo mientras se le busca patrocinador."
                : "la aprobación del plan y el trabajo del equipo van por su cuenta."}
            </p>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
