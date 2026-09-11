import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Tarjeta, TarjetaCabecera } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { fechaParaInput } from "@/lib/fechas";
import { aNumero } from "@/lib/utils";
import { guardarFichaSocioeconomica } from "../../acciones";
import { FormularioSocioeconomico } from "./formulario";

export const metadata: Metadata = { title: "Ficha socioeconómica" };

export const dynamic = "force-dynamic";

export default async function SocioeconomicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(
    PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
  );

  const [beneficiario, socio] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoExpediente: true,
      },
    }),
    prisma.fichaSocioeconomica.findUnique({ where: { beneficiarioId: id } }),
  ]);

  if (!beneficiario) notFound();

  return (
    <>
      <Link
        href={`/admin/beneficiarios/${beneficiario.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al expediente
      </Link>

      <EncabezadoPagina
        titulo="Ficha socioeconómica"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidos} · expediente ${beneficiario.codigoExpediente}`}
      />

      <Tarjeta className="p-6 sm:p-8">
        <TarjetaCabecera
          titulo={socio ? "Actualizar el estudio" : "Registrar el estudio"}
          descripcion="Hay una ficha por beneficiario: al guardar sustituye a la anterior. La fecha del estudio dice de cuándo es la foto del hogar."
          icono={<Home className="size-5" />}
        />
        <div className="pt-6">
          <FormularioSocioeconomico
            accion={guardarFichaSocioeconomica}
            beneficiarioId={beneficiario.id}
            valores={{
              integrantesHogar: socio?.integrantesHogar?.toString() ?? "",
              ingresoMensual: socio
                ? aNumero(socio.ingresoMensual).toFixed(2)
                : "",
              fuenteIngreso: socio?.fuenteIngreso ?? "",
              tipoVivienda: socio?.tipoVivienda ?? "",
              materialConstruccion: socio?.materialConstruccion ?? "",
              escolaridadEncargado: socio?.escolaridadEncargado ?? "",
              serviciosBasicos: (socio?.serviciosBasicos ?? []).join(", "),
              observaciones: socio?.observaciones ?? "",
              nivelVulnerabilidad: socio?.nivelVulnerabilidad ?? "MEDIO",
              elegibleBeca: socio?.elegibleBeca ?? false,
              fechaEstudio: socio
                ? fechaParaInput(socio.fechaEstudio)
                : fechaParaInput(new Date()),
              realizadoPor: socio?.realizadoPor ?? usuario.nombre,
            }}
          />
        </div>
      </Tarjeta>
    </>
  );
}
