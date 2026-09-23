import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Tarjeta, Vacio } from "@/components/ui";
import { PortadaBeneficiario } from "@/components/foto-beneficiario";
import { calcularEdad } from "@/lib/fechas";
import { listarTerapias, primerNombre, urlFotoBeneficiario } from "@/lib/utils";

/**
 * La galería pública de beneficiarios que esperan padrino. Se enseñan solo los
 * que la familia pidió publicar y la administración autorizó, y de cada uno
 * únicamente el primer nombre, la edad, las terapias y el resumen público.
 */
export const FILTRO_ESPERAN_PADRINO = {
  estado: "ACTIVO",
  publicadoEnGaleria: true,
  // Las dos condiciones: la familia lo pidió y la administración lo autorizó.
  solicitaPatrocinio: true,
  padrinazgos: { none: { activo: true } },
} as const;

/** Los que llevan más tiempo esperando van primero. */
export async function beneficiariosQueEsperan(limite?: number) {
  return prisma.beneficiario.findMany({
    where: FILTRO_ESPERAN_PADRINO,
    // Ni apellidos, ni diagnóstico, ni datos de la familia salen de la consulta.
    select: {
      id: true,
      nombres: true,
      fechaNacimiento: true,
      resumenPublico: true,
      fotoArchivo: true,
      terapias: { orderBy: { orden: "asc" }, select: { nombre: true } },
    },
    orderBy: { fechaIngreso: "asc" },
    ...(limite ? { take: limite } : {}),
  });
}

type Beneficiario = Awaited<ReturnType<typeof beneficiariosQueEsperan>>[number];

export function GaleriaBeneficiarios({
  ninos,
  className,
}: {
  ninos: Beneficiario[];
  className?: string;
}) {
  if (ninos.length === 0) {
    return (
      <Tarjeta className={className}>
        <Vacio mensaje="Ahora mismo todos los beneficiarios publicados tienen padrino asignado." />
      </Tarjeta>
    );
  }

  return (
    <ul className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className ?? ""}`}>
      {ninos.map((nino) => {
        const nombre = primerNombre(nino.nombres);
        return (
          <li key={nino.id} className="revela">
            <Tarjeta className="tarjeta-viva flex h-full flex-col p-6">
              <PortadaBeneficiario
                nombre={nombre}
                fotoUrl={urlFotoBeneficiario(nino.id, nino.fotoArchivo)}
              />
              <h3 className="mt-4 font-heading text-lg font-semibold text-ink">
                {nombre}, {calcularEdad(nino.fechaNacimiento)} años
              </h3>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
                <HeartPulse aria-hidden="true" className="size-4 shrink-0" />
                {listarTerapias(nino.terapias)}
              </p>
              {nino.resumenPublico ? (
                <p className="medida-lectura mt-3 flex-1 text-sm text-ink-soft">
                  {nino.resumenPublico}
                </p>
              ) : (
                <p className="mt-3 flex-1" />
              )}
              <Link
                href={`/apadrina/${nino.id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
              >
                Ver perfil
                <span className="visually-hidden">de {nombre}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Tarjeta>
          </li>
        );
      })}
    </ul>
  );
}
