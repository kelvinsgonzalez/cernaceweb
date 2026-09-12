import type { Metadata } from "next";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Tarjeta } from "@/components/ui";
import { FormularioPasarela } from "@/components/formularios-publicos";
import { iniciarDonacion } from "../../acciones";

export const metadata: Metadata = {
  title: "Pagar en línea",
  description: "Dona con tarjeta a CERNACE. Modo prueba.",
};

export const dynamic = "force-dynamic";

export default async function PasarelaPage() {
  const ajuste = await prisma.setting.findUnique({
    where: { clave: "donaciones.aporteSugerido" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/donar"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a las formas de donar
      </Link>

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        Pagar en línea
      </h1>
      <p className="medida-lectura mt-2 text-ink-soft">
        Indica cuánto quieres aportar y continúa a la pasarela.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="medida-lectura text-sm font-medium">
          Esta pasarela está en <strong>modo prueba</strong>. No se procesan
          cobros reales y en ningún paso se piden ni se guardan datos de tarjeta.
        </p>
      </div>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <FormularioPasarela
          accion={iniciarDonacion}
          montoSugerido={ajuste?.valor ?? "350"}
        />
      </Tarjeta>
    </div>
  );
}
