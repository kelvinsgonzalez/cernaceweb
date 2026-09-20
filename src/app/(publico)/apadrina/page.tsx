import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Tarjeta, Vacio } from "@/components/ui";
import { PortadaBeneficiario } from "@/components/foto-beneficiario";
import { SeccionComoAyudar } from "@/components/como-ayudar";
import { calcularEdad } from "@/lib/fechas";
import { listarTerapias, primerNombre, urlFotoBeneficiario } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Apadrina a un niño",
  description:
    "Beneficiarios de CERNACE que todavía no tienen un padrino asignado.",
};

export default async function GaleriaPage() {
  const ninos = await prisma.beneficiario.findMany({
    where: {
      estado: "ACTIVO",
      publicadoEnGaleria: true,
      // Las dos condiciones: la familia lo pidió y la administración lo autorizó.
      solicitaPatrocinio: true,
      padrinazgos: { none: { activo: true } },
    },
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
  });

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Juntos podemos crear posibilidades
          </h1>
        </div>
      </section>

      <SeccionComoAyudar />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-ink-soft" role="status">
          {ninos.length}{" "}
          {ninos.length === 1
            ? "beneficiario esperando padrino"
            : "beneficiarios esperando padrino"}
        </p>

        {ninos.length === 0 ? (
          <Tarjeta className="mt-4">
            <Vacio mensaje="Ahora mismo todos los beneficiarios publicados tienen padrino asignado." />
          </Tarjeta>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ninos.map((nino) => {
              const nombre = primerNombre(nino.nombres);
              return (
                <li key={nino.id} className="revela">
                  <Tarjeta className="tarjeta-viva flex h-full flex-col p-6">
                    <PortadaBeneficiario
                      nombre={nombre}
                      fotoUrl={urlFotoBeneficiario(nino.id, nino.fotoArchivo)}
                    />
                    <h2 className="mt-4 font-heading text-lg font-semibold text-ink">
                      {nombre}, {calcularEdad(nino.fechaNacimiento)} años
                    </h2>
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
        )}
      </div>
    </>
  );
}
