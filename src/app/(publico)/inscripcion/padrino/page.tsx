import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Tarjeta } from "@/components/ui";
import { FormularioPadrino } from "@/components/formularios-publicos";
import { enviarInscripcionPadrino } from "../../acciones";

export const metadata: Metadata = {
  title: "Inscripción de padrinos",
  description:
    "Formulario para apadrinar a un beneficiario de CERNACE con un aporte mensual.",
};

export const dynamic = "force-dynamic";

const COMPROMISOS = [
  "Un aporte mensual que sostiene terapias, material adaptado y transporte.",
  "Acceso al portal del padrino para consultar los avances publicados.",
  "Un informe trimestral con el desglose de en qué se usó tu aporte.",
];

const SOBRE_LA_CUENTA = [
  "Al enviar el formulario se crea tu cuenta con el correo y la contraseña que elijas.",
  "Entras desde “Iniciar sesión” con esas mismas credenciales.",
  "Tu portal se ve vacío hasta que el equipo te asigne un beneficiario.",
];

export default async function InscripcionPadrinoPage() {
  const [ajuste, sinPadrino] = await Promise.all([
    prisma.setting.findUnique({ where: { clave: "donaciones.aporteSugerido" } }),
    prisma.beneficiario.count({
      where: { estado: "ACTIVO", padrinazgos: { none: { activo: true } } },
    }),
  ]);

  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <p className="rotulo aparece text-brand-primary">Súmate</p>
          <h1 className="filete aparece aparece-2 mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Inscríbete como padrino
          </h1>
          <p className="medida-lectura aparece aparece-3 mt-4 text-lg text-ink">
            Hoy hay {sinPadrino}{" "}
            {sinPadrino === 1 ? "beneficiario" : "beneficiarios"} sin apoyo
            asignado. Al inscribirte creas tu cuenta del portal y el equipo te
            asigna a un beneficiario para que sigas su progreso.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
        <Tarjeta className="p-6 sm:p-8">
          <FormularioPadrino
            accion={enviarInscripcionPadrino}
            aporteSugerido={ajuste?.valor ?? "350"}
          />
        </Tarjeta>

        <aside className="flex flex-col gap-5">
          <Tarjeta className="p-6" aria-labelledby="que-incluye">
            <h2 id="que-incluye" className="font-heading text-lg font-semibold text-ink">
              Qué incluye el apadrinamiento
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {COMPROMISOS.map((punto) => (
                <li key={punto} className="medida-lectura">
                  {punto}
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta className="p-6" aria-labelledby="sobre-la-cuenta">
            <h2
              id="sobre-la-cuenta"
              className="font-heading text-lg font-semibold text-ink"
            >
              Sobre tu cuenta
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {SOBRE_LA_CUENTA.map((punto) => (
                <li key={punto} className="medida-lectura">
                  {punto}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              <Link
                href="/login"
                className="font-semibold text-brand-dark hover:underline"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </p>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
