import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";

/**
 * La franja que ven padrinos y familias cuando hay una campaña activa. Lleva a
 * la sección Donaciones de la portada, donde eligen a cuál aportar. Se
 * enciende sola con que exista una campaña activa y se apaga sola al cerrarla
 * o al pasar su fecha límite: nadie tiene que enviarla ni retirarla.
 */
export async function AvisoCampanas({ className }: { className?: string }) {
  const hoy = new Date();
  const campanas = await prisma.campaign.findMany({
    where: {
      activa: true,
      eliminadaEn: null,
      general: false,
      OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
    },
    orderBy: { fechaFin: "asc" },
    select: { titulo: true, slug: true, resumen: true },
  });
  if (campanas.length === 0) return null;

  const primera = campanas[0];
  const varias = campanas.length > 1;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-brand-yellow/20 p-4 ring-1 ring-brand-yellow/40 ${className ?? ""}`}
    >
      <p className="flex items-start gap-3 text-sm text-ink">
        <Megaphone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-dark" />
        <span>
          <span className="font-semibold">
            {varias
              ? `Hay ${campanas.length} campañas activas.`
              : `Campaña activa: ${primera.titulo}.`}
          </span>{" "}
          {varias ? "Elige a cuál aportar." : (primera.resumen ?? "")}
        </span>
      </p>
      <Link
        href={varias ? "/donar" : `/donar?campana=${primera.slug}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        {varias ? "Ver las campañas" : "Aportar"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
