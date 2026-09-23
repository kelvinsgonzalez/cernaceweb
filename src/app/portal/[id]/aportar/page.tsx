import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Campo, Tarjeta } from "@/components/ui";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { CLAVES_CUENTA, cuentasParaDepositar } from "@/lib/pasarela";
import { primerNombre } from "@/lib/utils";
import { FormularioAportePadrino } from "../../formulario";
import { enviarAporte } from "../../acciones";

export const metadata: Metadata = { title: "Aportar" };

export const dynamic = "force-dynamic";

export default async function AportarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.PORTAL_PADRINO);

  const [compromiso, ajustes] = await Promise.all([
    usuario.padrinoId
      ? prisma.padrinazgo.findFirst({
          where: { beneficiarioId: id, padrinoId: usuario.padrinoId, activo: true },
          select: { beneficiario: { select: { id: true, nombres: true } } },
        })
      : null,
    prisma.setting.findMany({
      where: { clave: { in: [...CLAVES_CUENTA] } },
      select: { clave: true, valor: true },
    }),
  ]);
  if (!compromiso) notFound();

  const nombre = primerNombre(compromiso.beneficiario.nombres);
  const cuentas = cuentasParaDepositar(ajustes);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/portal/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la ficha de {nombre}
      </Link>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-ink">
        Aportar para {nombre}
      </h1>
      <p className="medida-lectura mt-2 text-ink-soft">
        Deposita, transfiere o paga con tarjeta, y súbenos la foto del
        comprobante. No tienes que escribir el monto: el equipo lo lee de la foto
        y te avisa aquí cuando quede aprobado.
      </p>

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Building2 aria-hidden="true" className="size-5 text-brand-primary" />
          1. Si aún no has pagado, estas son las cuentas
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {cuentas.map((c) => (
            <section key={c.moneda} className="rounded-[var(--radius-sm)] border border-line p-5">
              <h3 className="font-heading text-base font-semibold text-ink">{c.moneda}</h3>
              <dl className="mt-4 grid gap-4">
                {c.campos.map((campo) => (
                  <Campo key={campo.etiqueta} etiqueta={campo.etiqueta}>
                    {campo.mono ? <span className="font-mono">{campo.valor}</span> : campo.valor}
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
          2. Sube la foto y, si quieres, deja unas palabras
        </h2>
        <div className="mt-6">
          <FormularioAportePadrino
            accion={enviarAporte}
            beneficiarioId={compromiso.beneficiario.id}
            nombre={nombre}
            tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
          />
        </div>
      </Tarjeta>
    </div>
  );
}
