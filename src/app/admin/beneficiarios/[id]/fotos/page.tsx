import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import {
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import { FotoBeneficiario } from "@/components/foto-beneficiario";
import { MAXIMO_FOTOS_EXPEDIENTE } from "@/lib/almacenamiento";
import { formatFechaHora } from "@/lib/fechas";
import { formatTamano, primerNombre, urlFotoBeneficiario } from "@/lib/utils";
import {
  eliminarFotoExpediente,
  guardarFotoPrincipal,
  subirFotosExpediente,
} from "../../acciones";
import {
  FormularioFotoPrincipal,
  FormularioFotosEvidencia,
} from "./formulario";

export const metadata: Metadata = { title: "Fotografías" };

export const dynamic = "force-dynamic";

export default async function FotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_ESCRIBIR);
  const puedePublicar = tienePermiso(usuario, PERMISOS.GALERIA_PUBLICAR);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoExpediente: true,
      fotoArchivo: true,
      estado: true,
      solicitaPatrocinio: true,
      publicadoEnGaleria: true,
      fotosExpediente: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          descripcion: true,
          visibleParaPadrino: true,
          tamanoBytes: true,
          subidaPor: true,
          createdAt: true,
        },
      },
    },
  });

  if (!beneficiario) notFound();

  const nombre = primerNombre(beneficiario.nombres);
  // Las mismas tres condiciones que aplica /api/fotos/beneficiario/[id]; se
  // repiten aquí solo para decirle a quien sube la foto dónde va a verse.
  const enElSitio =
    beneficiario.estado === "ACTIVO" &&
    beneficiario.solicitaPatrocinio &&
    beneficiario.publicadoEnGaleria;

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
        titulo="Fotografías del expediente"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
      />

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Tarjeta className="h-fit">
          <TarjetaCabecera
            titulo="Foto principal"
            descripcion="Una sola: identifica el expediente y es la que se ve en el sitio cuando se le busca padrino."
            icono={<Camera className="size-5" />}
          />
          <div className="flex flex-col items-center gap-3 border-b border-line p-5">
            <FotoBeneficiario
              nombre={nombre}
              fotoUrl={urlFotoBeneficiario(
                beneficiario.id,
                beneficiario.fotoArchivo,
              )}
              tamano={144}
              sinOptimizar
            />
            {enElSitio ? (
              <Chip tono="ok">Se está viendo en la página pública</Chip>
            ) : (
              <Chip tono="neutro">Solo la ve el personal</Chip>
            )}
            {puedePublicar ? (
              <Link
                href={`/admin/beneficiarios/${beneficiario.id}/publicacion`}
                className="text-xs font-semibold text-brand-dark hover:underline"
              >
                Gestionar la publicación
              </Link>
            ) : null}
          </div>
          <div className="p-5">
            <FormularioFotoPrincipal
              accion={guardarFotoPrincipal}
              id={beneficiario.id}
              tieneFoto={Boolean(beneficiario.fotoArchivo)}
            />
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Adjuntar fotos de evidencia"
              descripcion="El registro visual del caso: la condición al ingresar, una visita domiciliar, una ayuda entregada."
              icono={<Images className="size-5" />}
            />
            <div className="p-5">
              <FormularioFotosEvidencia
                accion={subirFotosExpediente}
                beneficiarioId={beneficiario.id}
                maximo={MAXIMO_FOTOS_EXPEDIENTE}
              />
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Fotos de evidencia"
              acciones={
                <Chip tono="neutro">
                  {beneficiario.fotosExpediente.length}{" "}
                  {beneficiario.fotosExpediente.length === 1 ? "foto" : "fotos"}
                </Chip>
              }
            />
            {beneficiario.fotosExpediente.length === 0 ? (
              <Vacio mensaje="Todavía no hay fotos de evidencia en este expediente." />
            ) : (
              <ul className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {beneficiario.fotosExpediente.map((foto) => (
                  <li
                    key={foto.id}
                    className="overflow-hidden rounded-[var(--radius-sm)] border border-line"
                  >
                    <Image
                      src={`/api/fotos/expediente/${foto.id}`}
                      alt={foto.descripcion ?? "Fotografía del expediente"}
                      width={400}
                      height={300}
                      unoptimized
                      className="aspect-[4/3] w-full bg-canvas object-cover"
                    />
                    <div className="flex flex-col gap-2 p-3">
                      {foto.descripcion ? (
                        <p className="text-sm text-ink">{foto.descripcion}</p>
                      ) : null}
                      <p className="text-xs text-ink-soft">
                        {foto.subidaPor} · {formatFechaHora(foto.createdAt)} ·{" "}
                        {formatTamano(foto.tamanoBytes)}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {foto.visibleParaPadrino ? (
                          <Chip tono="info">Compartida</Chip>
                        ) : (
                          <Chip tono="neutro">Solo el equipo</Chip>
                        )}
                        <MenuAcciones
                          id={foto.id}
                          etiqueta="Acciones de la fotografía"
                          titulo={foto.descripcion ?? "Fotografía"}
                        >
                          <OpcionConfirmada
                            menu={foto.id}
                            tono="peligro"
                            etiqueta="Eliminar"
                            mensaje="Se borra la fotografía y su archivo del almacenamiento. No se puede recuperar: lo único que queda es el registro en la bitácora."
                            confirmar="Sí, eliminar"
                            accion={eliminarFotoExpediente}
                          >
                            <input type="hidden" name="id" value={foto.id} />
                          </OpcionConfirmada>
                        </MenuAcciones>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
