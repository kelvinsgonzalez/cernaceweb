import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Images, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, EnlaceBoton, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { fechaParaInput } from "@/lib/fechas";
import { urlCampana } from "@/lib/sitio";
import { CompartirCampana } from "@/components/admin/compartir-campana";
import { FormularioCampana } from "../formulario";
import { actualizarCampana, alternarCampana, borrarFoto } from "../acciones";

export const metadata: Metadata = { title: "Editar campaña" };

export const dynamic = "force-dynamic";

export default async function EditarCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.DONACIONES_GESTIONAR);

  const campana = await prisma.campaign.findUnique({
    where: { id },
    include: { fotos: { orderBy: { orden: "asc" } } },
  });
  if (!campana || campana.eliminadaEn) notFound();

  const hoy = new Date();
  const abierta = campana.activa && (!campana.fechaFin || campana.fechaFin >= hoy);
  const enlace = await urlCampana(campana.slug);

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
        titulo={campana.titulo}
        descripcion={campana.general ? "La campaña general: siempre visible, sin meta ni fecha límite." : "Corrige los datos, añade fotos o cierra la campaña."}
        acciones={
          <>
            {campana.activa ? <Chip tono="ok">Activa</Chip> : <Chip tono="neutro">Cerrada</Chip>}
            <EnlaceBoton href={`/admin/campanas/${campana.id}/metricas`} variante="contorno">
              Ver métricas
            </EnlaceBoton>
            {!campana.general ? (
              <form action={alternarCampana}>
                <input type="hidden" name="id" value={campana.id} />
                <Boton type="submit" variante={campana.activa ? "peligro" : "contorno"}>
                  {campana.activa ? "Cerrar campaña" : "Reabrir campaña"}
                </Boton>
              </form>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta className="xl:col-span-2">
          <TarjetaCabecera
            titulo="Compartir en redes"
            descripcion={
              abierta
                ? "Quien abra este enlace ve la campaña con su foto y solo tiene que subir el comprobante. La primera foto es la que sale en la vista previa de WhatsApp y Facebook."
                : "La campaña está cerrada: el enlace muestra un aviso y manda a las campañas activas."
            }
            icono={<Share2 className="size-5" />}
          />
          <div className="p-5">
            <CompartirCampana
              url={enlace}
              titulo={campana.titulo}
              resumen={campana.resumen ?? ""}
            />
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera titulo="Datos de la campaña" />
          <div className="p-5">
            <FormularioCampana
              accion={actualizarCampana}
              hoy={fechaParaInput(new Date())}
              valores={{
                id: campana.id,
                titulo: campana.titulo,
                resumen: campana.resumen ?? "",
                descripcion: campana.descripcion,
                meta: String(Number(campana.meta)),
                fechaInicio: fechaParaInput(campana.fechaInicio),
                fechaFin: fechaParaInput(campana.fechaFin),
                general: campana.general,
              }}
            />
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera
            titulo="Fotos"
            descripcion="En el orden en que salen en la portada."
            icono={<Images className="size-5" />}
          />
          {campana.fotos.length === 0 ? (
            <div className="p-5">
              <Vacio mensaje="Todavía no tiene fotos. Añádelas desde el formulario." />
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 p-5">
              {campana.fotos.map((foto) => (
                <li key={foto.id} className="flex flex-col gap-2">
                  <Image
                    src={`/api/campanas/fotos/${foto.id}`}
                    alt={foto.alt ?? ""}
                    width={300}
                    height={300}
                    unoptimized
                    className="aspect-square w-full rounded-[var(--radius-sm)] border border-line object-cover"
                  />
                  <form action={borrarFoto}>
                    <input type="hidden" name="id" value={foto.id} />
                    <Boton type="submit" variante="contorno" className="w-full px-3 py-1.5 text-xs">
                      Quitar
                    </Boton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
