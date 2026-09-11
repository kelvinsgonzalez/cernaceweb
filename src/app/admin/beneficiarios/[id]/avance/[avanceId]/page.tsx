import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  AccesoRestringido,
  Chip,
  Tarjeta,
  TarjetaCabecera,
} from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import {
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import { MAXIMO_FOTOS } from "@/lib/almacenamiento";
import { fechaParaInput, formatFechaHora } from "@/lib/fechas";
import { actualizarAvance, eliminarFotoAvance } from "../../../acciones";
import { FormularioAvance } from "../formulario";

export const metadata: Metadata = { title: "Corregir avance" };

export const dynamic = "force-dynamic";

export default async function EditarAvancePage({
  params,
}: {
  params: Promise<{ id: string; avanceId: string }>;
}) {
  const { id, avanceId } = await params;
  const usuario = await requirePermiso(PERMISOS.SEGUIMIENTO_ESCRIBIR);

  const [beneficiario, avance] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
      },
    }),
    prisma.seguimiento.findUnique({
      where: { id: avanceId },
      include: { fotos: { select: { id: true } } },
    }),
  ]);

  if (!beneficiario || !avance || avance.beneficiarioId !== beneficiario.id) {
    notFound();
  }

  // La misma condición que comprueba el server action: aquí solo se evita
  // ofrecer un formulario que iba a ser rechazado.
  const gestiona = usuario.permisos.includes(PERMISOS.TERAPIA_GESTIONAR);
  const esSuyo = avance.registradoPorId === usuario.id;

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}#avances`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Corregir el avance"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
        acciones={
          <Chip tono="neutro">
            Lo escribió {avance.registradoPor} ·{" "}
            {formatFechaHora(avance.createdAt)}
          </Chip>
        }
      />

      {!gestiona && !esSuyo ? (
        <Tarjeta className="max-w-3xl p-5">
          <AccesoRestringido mensaje="Este avance lo escribió otra persona y lleva su firma. Solo puedes corregir los tuyos; para cambiar este, pídeselo a quien gestiona la terapia." />
        </Tarjeta>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Tarjeta className="p-6 sm:p-8">
            <FormularioAvance
              accion={actualizarAvance}
              beneficiarioId={beneficiario.id}
              avanceId={avance.id}
              hoy={fechaParaInput(new Date())}
              maximoFotos={MAXIMO_FOTOS}
              valores={{
                fecha: fechaParaInput(avance.fecha),
                area: avance.area,
                titulo: avance.titulo,
                descripcion: avance.descripcion,
                visibleParaPadrino: avance.visibleParaPadrino,
              }}
            />
          </Tarjeta>

          <Tarjeta className="h-fit">
            <TarjetaCabecera
              titulo="Fotos del avance"
              acciones={
                <Chip tono="neutro">
                  {avance.fotos.length} de {MAXIMO_FOTOS}
                </Chip>
              }
            />
            {avance.fotos.length === 0 ? (
              <p className="p-5 text-sm text-ink-soft">
                Este avance no tiene fotos. Puedes añadirlas desde el
                formulario.
              </p>
            ) : (
              <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
                {avance.fotos.map((foto) => (
                  <li key={foto.id} className="flex flex-col gap-2">
                    <Image
                      src={`/api/fotos/${foto.id}`}
                      alt={`Foto del avance ${avance.titulo}`}
                      width={320}
                      height={240}
                      unoptimized
                      className="aspect-[4/3] w-full rounded-[var(--radius-sm)] border border-line bg-canvas object-cover"
                    />
                    <MenuAcciones
                      id={foto.id}
                      etiqueta="Acciones de la foto del avance"
                      titulo={avance.titulo}
                    >
                      <OpcionConfirmada
                        menu={foto.id}
                        tono="peligro"
                        etiqueta="Quitar del avance"
                        mensaje="Se borra la foto y su archivo del almacenamiento. No se puede recuperar."
                        confirmar="Sí, quitarla"
                        accion={eliminarFotoAvance}
                      >
                        <input type="hidden" name="id" value={foto.id} />
                      </OpcionConfirmada>
                    </MenuAcciones>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      )}
    </>
  );
}
