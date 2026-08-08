import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import { pasarela } from "@/lib/pasarela";

export const metadata: Metadata = { title: "Configuración" };

export const dynamic = "force-dynamic";

const TITULOS_GRUPO: Record<string, string> = {
  general: "Datos de la organización",
  contacto: "Contacto público",
  donaciones: "Donaciones y pasarela",
};

export default async function ConfiguracionPage() {
  await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const ajustes = await prisma.setting.findMany({
    orderBy: [{ grupo: "asc" }, { clave: "asc" }],
  });

  const grupos = Array.from(new Set(ajustes.map((a) => a.grupo)));

  return (
    <>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Valores que alimentan el sitio público y el comportamiento de la plataforma."
      />

      <div className="mb-8 flex items-start gap-3 rounded-[var(--radius-sm)] bg-warn-bg p-5 text-warn-fg">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">
            Pasarela de pago: {pasarela.modoPrueba ? "modo prueba" : "producción"}
          </p>
          <p className="medida-lectura mt-1 text-sm">
            Implementación activa: {pasarela.nombre}. Para pasar a Stripe o PayPal
            basta con sustituir la implementación de la interfaz{" "}
            <code className="font-mono">Pasarela</code> en{" "}
            <code className="font-mono">src/lib/pasarela.ts</code>.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {grupos.map((grupo) => (
          <Tarjeta key={grupo} className="overflow-hidden">
            <TarjetaCabecera titulo={TITULOS_GRUPO[grupo] ?? grupo} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="visually-hidden">
                  Valores de configuración del grupo {TITULOS_GRUPO[grupo] ?? grupo}
                </caption>
                <thead className="border-b border-line bg-canvas">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      Clave
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      Valor
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      Descripción
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      Actualizado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ajustes
                    .filter((a) => a.grupo === grupo)
                    .map((ajuste) => (
                      <tr key={ajuste.id} className="align-top hover:bg-canvas">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <span className="font-mono text-xs text-ink">
                            {ajuste.clave}
                          </span>
                        </th>
                        <td className="px-4 py-3 font-medium text-ink">
                          {ajuste.valor}
                        </td>
                        <td className="medida-lectura px-4 py-3 text-ink-soft">
                          {ajuste.descripcion ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                          {formatFechaHora(ajuste.updatedAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        ))}
      </div>
    </>
  );
}
