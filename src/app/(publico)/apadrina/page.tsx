import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Boton, EnlaceBoton, Tarjeta, Vacio } from "@/components/ui";
import { IconoPrograma } from "@/components/icono-programa";
import { PortadaBeneficiario } from "@/components/foto-beneficiario";
import { calcularEdad } from "@/lib/fechas";
import { primerNombre, urlFotoBeneficiario } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Apadrina a un niño",
  description:
    "Beneficiarios de CERNACE que todavía no tienen un padrino asignado.",
};

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ programa?: string }>;
}) {
  const { programa } = await searchParams;

  const [programas, ninos] = await Promise.all([
    prisma.programa.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.beneficiario.findMany({
      where: {
        estado: "ACTIVO",
        publicadoEnGaleria: true,
        // Las dos condiciones: la familia lo pidió y la administración lo autorizó.
        solicitaPatrocinio: true,
        padrinazgos: { none: { activo: true } },
        ...(programa ? { programaId: programa } : {}),
      },
      // Ni apellidos, ni diagnóstico, ni datos de la familia salen de la consulta.
      select: {
        id: true,
        nombres: true,
        fechaNacimiento: true,
        resumenPublico: true,
        fotoArchivo: true,
        programa: { select: { nombre: true, icono: true } },
      },
      orderBy: { fechaIngreso: "asc" },
    }),
  ]);

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="rotulo aparece text-brand-primary">Apadrinamiento</p>
          <h1 className="filete aparece aparece-2 mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Ellos esperan un padrino
          </h1>
          <p className="medida-lectura aparece aparece-3 mt-4 text-lg text-ink">
            Estos beneficiarios están activos en un programa pero todavía no
            tienen apoyo asignado. Para proteger su privacidad publicamos
            únicamente su primer nombre, su edad y el programa al que asisten.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Filtro sin JavaScript: formulario GET. */}
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filtro-programa"
              className="text-sm font-semibold text-ink"
            >
              Filtrar por programa
            </label>
            <select
              id="filtro-programa"
              name="programa"
              defaultValue={programa ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Todos los programas</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <Boton type="submit" variante="contorno">
            <Filter aria-hidden="true" className="size-4" />
            Aplicar filtro
          </Boton>
          {programa ? (
            <EnlaceBoton href="/apadrina" variante="suave">
              Quitar filtro
            </EnlaceBoton>
          ) : null}
        </form>

        <p className="mt-6 text-sm text-ink-soft" role="status">
          {ninos.length}{" "}
          {ninos.length === 1
            ? "beneficiario esperando padrino"
            : "beneficiarios esperando padrino"}
        </p>

        {ninos.length === 0 ? (
          <Tarjeta className="mt-4">
            <Vacio mensaje="No hay beneficiarios publicados con ese filtro." />
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
                      <IconoPrograma
                        nombre={nino.programa.icono}
                        className="size-4"
                      />
                      {nino.programa.nombre}
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
