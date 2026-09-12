import type { Metadata } from "next";
import { ArrowLeft, Building2, Receipt } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Campo, Tarjeta } from "@/components/ui";
import { FormularioDonativoDirecto } from "@/components/formularios-publicos";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { CLAVES_CUENTA, CUENTA_PREDETERMINADA } from "@/lib/pasarela";
import { registrarDonativoDirecto } from "../../acciones";

export const metadata: Metadata = {
  title: "Depositar y subir la boleta",
  description:
    "Las cuentas de CERNACE para depositar y el formulario para subir tu boleta.",
};

export const dynamic = "force-dynamic";

export default async function DepositoPage() {
  // Las cuentas a las que se deposita salen de Configuración; si todavía no
  // están cargadas se usan los valores por defecto, para no dejar la página
  // coja.
  const ajustes = await prisma.setting.findMany({
    where: { clave: { in: [...CLAVES_CUENTA] } },
    select: { clave: true, valor: true },
  });
  const cuenta = (clave: string) =>
    ajustes.find((a) => a.clave === clave)?.valor ?? CUENTA_PREDETERMINADA[clave];

  // Dos cuentas, una por moneda: quien dona elige según desde dónde deposita.
  type CampoCuenta = { etiqueta: string; valor: string; mono?: boolean };
  const cuentas: { moneda: string; campos: CampoCuenta[] }[] = [
    {
      moneda: "Quetzales (GTQ)",
      campos: [
        { etiqueta: "Banco", valor: cuenta("donaciones.banco") },
        { etiqueta: "Tipo de cuenta", valor: cuenta("donaciones.cuentaTipo") },
        {
          etiqueta: "Número de cuenta",
          valor: cuenta("donaciones.cuentaNumero"),
          mono: true,
        },
        { etiqueta: "A nombre de", valor: cuenta("donaciones.cuentaTitular") },
      ],
    },
    {
      moneda: "Dólares (USD)",
      campos: [
        { etiqueta: "Banco", valor: cuenta("donaciones.bancoDolares") },
        {
          etiqueta: "Número de cuenta",
          valor: cuenta("donaciones.cuentaDolaresNumero"),
          mono: true,
        },
        {
          etiqueta: "A nombre de",
          valor: cuenta("donaciones.cuentaDolaresTitular"),
        },
      ],
    },
  ];

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
        Deposita y sube tu boleta
      </h1>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Building2 aria-hidden="true" className="size-5 text-brand-primary" />
          1. Deposita o transfiere a una de estas cuentas
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {cuentas.map((c) => (
            <section
              key={c.moneda}
              className="rounded-[var(--radius-sm)] border border-line p-5"
            >
              <h3 className="font-heading text-base font-semibold text-ink">
                {c.moneda}
              </h3>
              <dl className="mt-4 grid gap-4">
                {c.campos.map((campo) => (
                  <Campo key={campo.etiqueta} etiqueta={campo.etiqueta}>
                    {campo.mono ? (
                      <span className="font-mono">{campo.valor}</span>
                    ) : (
                      campo.valor
                    )}
                  </Campo>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Receipt aria-hidden="true" className="size-5 text-brand-primary" />
          2. Sube la boleta
        </h2>
        <div className="mt-6">
          <FormularioDonativoDirecto
            accion={registrarDonativoDirecto}
            tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
          />
        </div>
      </Tarjeta>
    </div>
  );
}
