import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import { leerContacto } from "@/components/publico";
import { FormularioContacto } from "@/components/formularios-publicos";
import { enviarContacto } from "../acciones";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos o visítanos en Chimaltenango.",
};

export const dynamic = "force-dynamic";

export default async function ContactoPage() {
  const contacto = await leerContacto();

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

        <aside aria-labelledby="datos-contacto">
          <Tarjeta className="p-6">
            <h2 id="datos-contacto" className="font-heading text-lg font-semibold text-ink">
              Dónde encontrarnos
            </h2>
            <address className="mt-4 space-y-4 text-sm not-italic text-ink-soft">
              <p className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                {contacto.direccion}
              </p>
              <p className="flex items-start gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                <a href={`tel:${contacto.telefono.replace(/\s/g, "")}`} className="hover:underline">
                  {contacto.telefono}
                </a>
              </p>
              <p className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                <a href={`mailto:${contacto.email}`} className="hover:underline">
                  {contacto.email}
                </a>
              </p>
              <p className="flex items-start gap-3">
                <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                Lunes a viernes, 8:00 a 16:30
              </p>
            </address>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
