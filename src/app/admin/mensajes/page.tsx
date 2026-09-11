import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { ChipSolicitud, Tarjeta, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { SelectorEstado } from "@/components/admin/selector-estado";
import { formatFechaHora } from "@/lib/fechas";
import { cambiarEstadoMensaje } from "../acciones";

export const metadata: Metadata = { title: "Mensajes de contacto" };

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  await requirePermiso(PERMISOS.SOLICITUDES_ATENDER);

  const mensajes = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Mensajes de contacto"
        descripcion="Consultas recibidas desde el formulario público de contacto."
      />

      {mensajes.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="No hay mensajes recibidos." />
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {mensajes.map((mensaje) => (
            <li key={mensaje.id}>
              <Tarjeta className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-ink">
                      {mensaje.asunto}
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {mensaje.nombre} · {mensaje.email}
                      {mensaje.telefono ? ` · ${mensaje.telefono}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Recibido el {formatFechaHora(mensaje.createdAt)}
                    </p>
                  </div>
                  <ChipSolicitud estado={mensaje.estado} />
                </div>

                <p className="medida-lectura mt-4 text-sm text-ink">
                  {mensaje.mensaje}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-4">
                  <SelectorEstado
                    accion={cambiarEstadoMensaje}
                    id={mensaje.id}
                    estado={mensaje.estado}
                    descripcion={`el mensaje «${mensaje.asunto}»`}
                  />
                  <a
                    href={`mailto:${mensaje.email}?subject=${encodeURIComponent(`Re: ${mensaje.asunto}`)}`}
                    className="text-sm font-semibold text-brand-primary hover:underline"
                  >
                    Responder por correo
                    <span className="visually-hidden"> a {mensaje.nombre}</span>
                  </a>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
