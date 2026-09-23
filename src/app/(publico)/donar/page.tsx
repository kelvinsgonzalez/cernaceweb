import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Megaphone, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { CuentasDeposito } from "@/components/cuentas-deposito";
import { FormularioAporteCampana } from "@/components/formularios-publicos";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { CLAVES_CUENTA, cuentasParaDepositar } from "@/lib/pasarela";
import { campanasActivas } from "@/lib/aportes";
import { formatFecha } from "@/lib/fechas";
import { registrarAporteCampana } from "../acciones";

export const metadata: Metadata = {
  title: "Donaciones",
  description:
    "Las campañas activas de CERNACE, las cuentas para depositar y el formulario para subir la foto de tu comprobante.",
};

export const dynamic = "force-dynamic";

/**
 * Donaciones, todo en una página: arriba las campañas activas (y la general),
 * cada una con su botón; abajo las cuentas, el banner de la campaña elegida y
 * la foto del comprobante. La campaña viaja en la URL (?campana=slug) y el
 * botón baja hasta #aportar. Sin campaña, el aporte va a la general.
 */
export default async function DonarPage({
  searchParams,
}: {
  searchParams: Promise<{ campana?: string }>;
}) {
  const { campana } = await searchParams;
  const [ajustes, campanas] = await Promise.all([
    prisma.setting.findMany({
      where: { clave: { in: [...CLAVES_CUENTA] } },
      select: { clave: true, valor: true },
    }),
    campanasActivas(),
  ]);
  const cuentas = cuentasParaDepositar(ajustes);
  const general = campanas.find((c) => c.general);
  const elegida = campanas.find((c) => c.slug === campana) ?? general;
  const fotoElegida = elegida?.fotos[0];

  return (
    <>
      {/* Campañas: a cuál va el aporte */}
      <section
        id="campanas"
        className="franja-clara border-b border-line py-12 sm:py-16"
        aria-labelledby="donaciones-titulo"
      >
        <div className="mx-auto max-w-6xl px-4">
          <p className="rotulo text-brand-primary">Donaciones</p>
          <h1
            id="donaciones-titulo"
            className="mt-2 font-heading text-3xl font-semibold text-ink sm:text-4xl"
          >
            Es tu turno de aportar a una nueva historia
          </h1>
          <p className="medida-lectura mt-3 text-ink-soft">
            Elige a qué va tu aporte. Deposita o transfiere a nuestras cuentas y
            súbenos la foto del comprobante: eso es todo.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campanas.map((c) => {
              const foto = c.fotos[0];
              const seleccionada = elegida?.id === c.id;
              return (
                <li key={c.id} className="revela">
                  <Tarjeta
                    className={`tarjeta-viva flex h-full flex-col overflow-hidden ${
                      seleccionada ? "ring-2 ring-brand-primary" : ""
                    }`}
                  >
                    {foto ? (
                      <Image
                        src={`/api/campanas/fotos/${foto.id}`}
                        alt={foto.alt ?? ""}
                        width={800}
                        height={450}
                        unoptimized
                        className="aspect-[16/9] w-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex aspect-[16/9] w-full items-center justify-center bg-brand-sky text-brand-primary"
                      >
                        <Megaphone className="size-10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      {seleccionada ? (
                        <p className="rotulo mb-2 text-brand-primary">
                          Campaña elegida
                        </p>
                      ) : null}
                      <h2 className="line-clamp-2 font-heading text-lg font-semibold text-ink [overflow-wrap:anywhere]">
                        {c.titulo}
                      </h2>
                      <p className="medida-lectura mt-2 line-clamp-3 flex-1 text-sm text-ink-soft [overflow-wrap:anywhere]">
                        {c.resumen ?? c.descripcion}
                      </p>
                      {c.fechaFin ? (
                        <p className="mt-4 text-xs text-ink-soft">
                          Hasta el {formatFecha(c.fechaFin)}
                        </p>
                      ) : null}
                      <EnlaceBoton
                        href={`/donar?campana=${c.slug}#aportar`}
                        className="mt-5 self-start px-5 py-2.5"
                        variante={c.general ? "contorno" : "solido"}
                      >
                        Aportar
                        <span className="visually-hidden"> a {c.titulo}</span>
                      </EnlaceBoton>
                    </div>
                  </Tarjeta>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Aportar: banner de la campaña elegida, cuentas y comprobante */}
      <section
        id="aportar"
        className="mx-auto max-w-3xl scroll-mt-6 px-4 py-12"
        aria-labelledby="aportar-titulo"
      >
        {elegida ? (
          <Tarjeta className="overflow-hidden ring-2 ring-brand-primary">
            <div className="grid sm:grid-cols-[minmax(0,14rem)_1fr]">
              {fotoElegida ? (
                <Image
                  src={`/api/campanas/fotos/${fotoElegida.id}`}
                  alt={fotoElegida.alt ?? ""}
                  width={800}
                  height={450}
                  unoptimized
                  className="aspect-[16/9] h-full w-full object-cover sm:aspect-auto"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex aspect-[16/9] w-full items-center justify-center bg-brand-sky text-brand-primary sm:aspect-auto sm:min-h-full"
                >
                  <Megaphone className="size-10" />
                </div>
              )}
              <div className="p-5 sm:p-6">
                <p className="rotulo text-brand-primary">
                  {elegida.general ? "Tu aporte va a" : "Estás apoyando a"}
                </p>
                <p className="mt-1 line-clamp-2 font-heading text-xl font-semibold text-ink [overflow-wrap:anywhere]">
                  {elegida.titulo}
                </p>
                <p className="medida-lectura mt-2 line-clamp-3 text-sm text-ink-soft [overflow-wrap:anywhere]">
                  {elegida.resumen ?? elegida.descripcion}
                </p>
                {elegida.fechaFin ? (
                  <p className="mt-3 text-xs text-ink-soft">
                    Hasta el {formatFecha(elegida.fechaFin)}
                  </p>
                ) : null}
                <Link
                  href="/donar#campanas"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                  Elegir otra campaña
                </Link>
              </div>
            </div>
          </Tarjeta>
        ) : null}

        <h2
          id="aportar-titulo"
          className="mt-10 font-heading text-3xl font-semibold tracking-tight text-ink"
        >
          ¡Ayúdanos a ayudar!
        </h2>
        <p className="medida-lectura mt-2 text-ink-soft">
          Deposita o transfiere a una de nuestras cuentas y súbenos la foto del
          comprobante. El equipo la coteja y tu aporte queda registrado.
        </p>

        <CuentasDeposito cuentas={cuentas} />

        <Tarjeta className="mt-6 p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Receipt aria-hidden="true" className="size-5 text-brand-primary" />
            2. Sube la foto del comprobante
          </h3>
          <div className="mt-6">
            <FormularioAporteCampana
              // La clave fuerza a que el selector arranque en la campaña de la URL
              // cuando se cambia de una a otra sin recargar la página.
              key={elegida?.slug ?? "general"}
              accion={registrarAporteCampana}
              tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
              campanas={campanas.map((c) => ({
                slug: c.slug,
                titulo: c.titulo,
                general: c.general,
              }))}
              campanaInicial={elegida?.slug}
            />
          </div>
        </Tarjeta>
      </section>
    </>
  );
}
