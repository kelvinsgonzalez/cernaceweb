import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Megaphone, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EnlaceBoton, Tarjeta } from "@/components/ui";
import { CuentasDeposito } from "@/components/cuentas-deposito";
import { FormularioAporteCampana } from "@/components/formularios-publicos";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { CLAVES_CUENTA, cuentasParaDepositar } from "@/lib/pasarela";
import { formatFecha } from "@/lib/fechas";
import { urlCampana, urlSitio } from "@/lib/sitio";
import { registrarAporteCampana } from "../../acciones";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function buscarCampana(slug: string) {
  return prisma.campaign.findUnique({
    where: { slug },
    include: {
      fotos: { orderBy: { orden: "asc" }, take: 1, select: { id: true, alt: true } },
    },
  });
}

function estaAbierta(campana: {
  activa: boolean;
  fechaFin: Date | null;
  eliminadaEn: Date | null;
}): boolean {
  return (
    campana.activa &&
    !campana.eliminadaEn &&
    (!campana.fechaFin || campana.fechaFin >= new Date())
  );
}

/**
 * La vista previa que muestran WhatsApp, Facebook y X al pegar el enlace: el
 * título de la campaña, su frase y la primera foto. La foto solo se sirve
 * mientras la campaña está activa, igual que la página.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campana = await buscarCampana(slug);
  if (!campana) return { title: "Campaña no encontrada" };

  const [sitio, url] = await Promise.all([urlSitio(), urlCampana(campana.slug)]);
  const foto = campana.fotos[0];
  const titulo = `Aporta a ${campana.titulo}`;
  const descripcion = campana.resumen ?? campana.descripcion;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "CERNACE",
      locale: "es_GT",
      url,
      title: `${titulo} · CERNACE`,
      description: descripcion,
      images: foto
        ? [{ url: `${sitio}/api/campanas/fotos/${foto.id}`, alt: foto.alt ?? campana.titulo }]
        : [],
    },
    twitter: {
      card: foto ? "summary_large_image" : "summary",
      title: `${titulo} · CERNACE`,
      description: descripcion,
    },
  };
}

/**
 * La página de una campaña, pensada para compartirse en redes: quien abre el
 * enlace ve de qué trata, las cuentas para depositar y el formulario del
 * comprobante con la campaña ya asignada. Solo le falta subir la foto.
 */
export default async function CampanaPublicaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const campana = await buscarCampana(slug);
  if (!campana) notFound();

  const foto = campana.fotos[0];
  const abierta = estaAbierta(campana);

  if (!abierta) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Tarjeta className="p-6 sm:p-8">
          <p className="rotulo text-brand-primary">Campaña cerrada</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink">
            {campana.titulo}
          </h1>
          <p className="medida-lectura mt-3 text-ink-soft">
            Esta campaña ya terminó. ¡Gracias a todos los que aportaron! Si
            quieres seguir ayudando, mira las campañas que están abiertas ahora.
          </p>
          <EnlaceBoton href="/donar" className="mt-6 px-6 py-3 text-base">
            Ver las campañas activas
          </EnlaceBoton>
        </Tarjeta>
      </div>
    );
  }

  const ajustes = await prisma.setting.findMany({
    where: { clave: { in: [...CLAVES_CUENTA] } },
    select: { clave: true, valor: true },
  });
  const cuentas = cuentasParaDepositar(ajustes);
  const opcion = { slug: campana.slug, titulo: campana.titulo, general: campana.general };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/donar"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Ver todas las campañas
      </Link>

      {/* Banner: la foto dice de qué campaña se trata */}
      <Tarjeta className="overflow-hidden ring-2 ring-brand-primary">
        {foto ? (
          <Image
            src={`/api/campanas/fotos/${foto.id}`}
            alt={foto.alt ?? ""}
            width={1200}
            height={675}
            priority
            unoptimized
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex aspect-[21/9] w-full items-center justify-center bg-brand-sky text-brand-primary"
          >
            <Megaphone className="size-12" />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <p className="rotulo text-brand-primary">
            {campana.general ? "Tu aporte va a" : "Estás apoyando a"}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">
            {campana.titulo}
          </h1>
          <p className="medida-lectura mt-3 text-ink-soft [overflow-wrap:anywhere]">
            {campana.descripcion}
          </p>
          {campana.fechaFin ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              Hasta el {formatFecha(campana.fechaFin)}
            </p>
          ) : null}
        </div>
      </Tarjeta>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-tight text-ink">
        Así se aporta
      </h2>
      <p className="medida-lectura mt-2 text-ink-soft">
        Deposita o transfiere a una de nuestras cuentas y súbenos la foto del
        comprobante. El equipo la coteja y tu aporte queda registrado en esta
        campaña.
      </p>

      <CuentasDeposito cuentas={cuentas} />

      <Tarjeta className="mt-6 p-6 sm:p-8">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Receipt aria-hidden="true" className="size-5 text-brand-primary" />
          2. Sube la foto del comprobante
        </h3>
        <div className="mt-6">
          <FormularioAporteCampana
            accion={registrarAporteCampana}
            tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
            campanas={[opcion]}
            campanaFija={opcion}
          />
        </div>
      </Tarjeta>
    </div>
  );
}
