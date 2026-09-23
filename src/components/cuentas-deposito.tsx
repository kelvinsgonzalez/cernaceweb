import { Building2 } from "lucide-react";
import { Campo, Tarjeta } from "@/components/ui";
import type { cuentasParaDepositar } from "@/lib/pasarela";

/**
 * Las cuentas de CERNACE para depositar o transferir, tal como las configura
 * el administrador. La misma tarjeta sale en /donar y en la página de cada
 * campaña que se comparte en redes.
 */
export function CuentasDeposito({
  cuentas,
  className,
}: {
  cuentas: ReturnType<typeof cuentasParaDepositar>;
  className?: string;
}) {
  return (
    <Tarjeta className={className ?? "mt-6 p-6 sm:p-8"}>
      <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
        <Building2 aria-hidden="true" className="size-5 text-brand-primary" />
        1. Deposita o transfiere a una de estas cuentas
      </h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {cuentas.map((c) => (
          <section
            key={c.moneda}
            className="rounded-[var(--radius-sm)] border border-line p-5"
          >
            <h4 className="font-heading text-base font-semibold text-ink">
              {c.moneda}
            </h4>
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
      <p className="medida-lectura mt-5 text-sm text-ink-soft">
        También puedes pagar con tarjeta en la banca en línea o en un POS del
        banco: sube igual la foto del recibo.
      </p>
    </Tarjeta>
  );
}
