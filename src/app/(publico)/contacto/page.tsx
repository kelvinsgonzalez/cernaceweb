import type { Metadata } from "next";
import { Tarjeta } from "@/components/ui";
import { FormularioContacto } from "@/components/formularios-publicos";
import { SeccionDirectorio, TarjetaCanales } from "@/components/directorio";
import { SeccionJuntaDirectiva } from "@/components/junta-directiva";
import { enviarContacto } from "../acciones";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos o visítanos en el Caserío San Pedro, Cuilco, Huehuetenango.",
};

export const dynamic = "force-dynamic";

export default function ContactoPage() {
  return (
    <>
      <section className="franja-clara border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="rotulo aparece text-brand-primary">Escríbenos</p>
          <h1 className="filete aparece aparece-2 mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-dark sm:text-5xl">
            Contacto
          </h1>
          <p className="medida-lectura aparece aparece-3 mt-4 text-lg text-ink">
            Escríbenos para consultas sobre inscripciones, donaciones, visitas o
            alianzas. Respondemos en horario de oficina.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
        <Tarjeta className="p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Envíanos un mensaje
          </h2>
          <div className="mt-6">
            <FormularioContacto accion={enviarContacto} />
          </div>
        </Tarjeta>

        <aside>
          <TarjetaCanales />
        </aside>
      </div>

      <SeccionDirectorio />
      <SeccionJuntaDirectiva />
    </>
  );
}
