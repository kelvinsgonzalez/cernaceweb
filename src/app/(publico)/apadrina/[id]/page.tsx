import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { calcularEdad } from "@/lib/fechas";
import { primerNombre } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nino = await prisma.beneficiario.findFirst({
    where: { id, publicadoEnGaleria: true, estado: "ACTIVO" },
    select: { nombres: true },
  });
  if (!nino) return { title: "Perfil no disponible" };
  return { title: `Apadrina a ${primerNombre(nino.nombres)}` };
}

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Perfil público: la consulta selecciona únicamente los campos que se
  // pueden publicar. Apellidos, CUI, diagnóstico y datos familiares no se
  // traen de la base.
  const nino = await prisma.beneficiario.findFirst({
    where: { id, publicadoEnGaleria: true, estado: "ACTIVO" },
    select: {
      id: true,
      nombres: true,
      fechaNacimiento: true,
      resumenPublico: true,
      programa: { select: { nombre: true, descripcion: true, icono: true } },
      padrinazgos: { where: { activo: true }, select: { id: true } },
    },
  });

  if (!nino) notFound();

  const nombre = primerNombre(nino.nombres);
  const tienePadrino = nino.padrinazgos.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/apadrina"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la galería
      </Link>

      <Tarjeta className="mt-6 p-8">
        <div className="flex flex-wrap items-center gap-5">
          <span
            aria-hidden="true"
            className="flex size-20 items-center justify-center rounded-full bg-brand-yellow font-heading text-3xl font-bold text-brand-dark"
          >
            {nombre[0]}
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink">
              {nombre}, {calcularEdad(nino.fechaNacimiento)} años
            </h1>
            <p className="mt-1 inline-flex items-center gap-2 text-brand-primary">
              <IconoPrograma nombre={nino.programa.icono} className="size-4" />
              {nino.programa.nombre}
            </p>
          </div>
        </div>

        {nino.resumenPublico ? (
          <p className="medida-lectura mt-6 text-lg text-ink">
            {nino.resumenPublico}
          </p>
        ) : null}

        <h2 className="mt-8 font-heading text-lg font-semibold text-ink">
          Sobre su programa
        </h2>
        <p className="medida-lectura mt-2 text-ink-soft">
          {nino.programa.descripcion}
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-sm)] bg-brand-sky p-5">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand-dark"
          />
          <p className="medida-lectura text-sm text-brand-dark">
            Por protección de datos, esta página no muestra apellidos,
            diagnóstico ni información de su familia. Esos datos viven en el
            expediente y solo los consulta el personal autorizado.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {tienePadrino ? (
            <p className="text-sm font-semibold text-ok-fg">
              {nombre} ya cuenta con un padrino asignado.
            </p>
          ) : (
            <>
              <EnlaceBoton href="/inscripcion/padrino" className="px-6 py-3">
                Quiero apadrinar a {nombre}
              </EnlaceBoton>
              <EnlaceBoton href="/donar" variante="contorno" className="px-6 py-3">
                Hacer una donación puntual
              </EnlaceBoton>
            </>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
