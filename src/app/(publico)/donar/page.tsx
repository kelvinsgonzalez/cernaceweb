import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Carrusel, type Lamina } from "@/components/carrusel";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Donar",
  description:
    "Ayúdanos a ayudar. Deposita en el banco y sube tu boleta, o paga en línea.",
};

export const dynamic = "force-dynamic";

export default async function DonarPage() {
  // El carrusel enseña las mismas historias que publica el equipo desde
  // /admin/historias: cambiarlas no obliga a tocar esta página.
  const historias = await prisma.story.findMany({
    where: { estado: "PUBLICADO", imagenUrl: { not: null } },
    orderBy: { publicadaEn: "desc" },
    select: {
      id: true,
      titulo: true,
      resumen: true,
      protagonista: true,
      imagenUrl: true,
    },
  });

  const laminas: Lamina[] = historias
    // next/image solo tiene configurado el dominio propio: una URL externa
    // guardada a mano en la historia reventaría la página entera.
    .filter((historia) => historia.imagenUrl?.startsWith("/"))
    .map((historia) => ({
      src: historia.imagenUrl as string,
      alt: `Fotografía de ${historia.protagonista}`,
      pie: historia.titulo,
      titulo: historia.titulo,
      texto: historia.resumen,
    }));

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h1 className="filete aparece font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            ¡Ayúdanos a ayudar!
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Sin historias publicadas con foto no se pinta ni el título ni un
            marco vacío. */}
        {laminas.length > 0 ? (
          <>
            <h2 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">
              Conoce nuestras historias de éxito
            </h2>
            <Carrusel
              laminas={laminas}
              etiqueta="Historias de quienes reciben tu apoyo"
              encuadre="cover"
              className="mt-6"
            />
          </>
        ) : null}

        {/* Los dos caminos cierran la página, después de las historias. La
            superficie entera es el enlace —no un botón dentro de una tarjeta—
            para que el área que responde al puntero sea la que se ve. */}
        <h2 className="mt-12 font-heading text-2xl font-semibold text-ink sm:text-3xl">
          Es tu turno de aportar a una nueva historia
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <AccesoDonacion
            href="/donar/deposito"
            icono={<Building2 aria-hidden="true" className="size-6" />}
            etiqueta="Depositar en el banco"
            destacado
          />
          <AccesoDonacion
            href="/donar/pagar"
            icono={<CreditCard aria-hidden="true" className="size-6" />}
            etiqueta="Pagar en línea"
          />
        </div>
      </div>
    </>
  );
}

/**
 * Acceso grande a uno de los dos caminos para donar. `destacado` lo pinta en
 * el azul de marca: es el camino que más se usa y conviene que gane el ojo.
 */
function AccesoDonacion({
  href,
  icono,
  etiqueta,
  destacado,
}: {
  href: string;
  icono: ReactNode;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "tarjeta-viva grupo-flecha group flex items-center gap-4 rounded-[var(--radius-md)] border p-5 shadow-suave sm:p-6",
        destacado
          ? "border-brand-primary bg-brand-primary text-crema"
          : "border-line bg-surface text-ink hover:border-brand-primary",
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-300 ease-suave",
          destacado
            ? "bg-crema/15 text-crema group-hover:bg-crema/25"
            : "bg-brand-sky text-brand-primary group-hover:bg-brand-primary group-hover:text-crema",
        )}
      >
        {icono}
      </span>
      <span className="flex-1 font-heading text-lg font-semibold sm:text-xl">
        {etiqueta}
      </span>
      <ArrowRight
        aria-hidden="true"
        className={cn(
          "flecha size-5 shrink-0",
          destacado ? "text-crema" : "text-brand-primary",
        )}
      />
    </Link>
  );
}
