import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Boton, Chip, MensajeFormulario, Tarjeta } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import {
  MAXIMO_HISTORIAS,
  textoAlternativo,
  urlImagenHistoria,
} from "@/lib/historias";
import { FormularioHistoria } from "./formulario";
import {
  actualizarHistoria,
  alternarVisibilidadHistoria,
  crearHistoria,
  vaciarCasilla,
} from "./acciones";

export const metadata: Metadata = { title: "Historias" };

export const dynamic = "force-dynamic";

const CASILLAS = Array.from({ length: MAXIMO_HISTORIAS }, (_, i) => i + 1);

/** Lo que cuenta la vuelta de una acción de la casilla. */
const AVISOS: Record<string, { tipo: "ok" | "error"; texto: string }> = {
  mostrada: {
    tipo: "ok",
    texto: "Historia mostrada. Ya se ve en la página de inicio.",
  },
  oculta: {
    tipo: "ok",
    texto:
      "Historia oculta: deja de verse en el sitio, pero sigue entera en su casilla como borrador.",
  },
  vaciada: {
    tipo: "ok",
    texto:
      "Casilla vaciada. La historia y su fotografía se eliminaron; de ellas solo queda el registro en la bitácora.",
  },
  tope: {
    tipo: "error",
    texto: `La portada ya tiene sus ${MAXIMO_HISTORIAS} historias a la vista. Oculta alguna antes de mostrar otra.`,
  },
  "sin-foto": {
    tipo: "error",
    texto:
      "Esa historia todavía no tiene fotografía. Ábrela con «Editar», súbele una y vuelve a mostrarla.",
  },
};

/** Un `<summary>` que se ve y se comporta como un botón. */
const claseDisparador =
  "inline-flex cursor-pointer list-none items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2.5 text-sm font-semibold transition [&::-webkit-details-marker]:hidden";

export default async function HistoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  await requirePermiso(PERMISOS.CONTENIDO_GESTIONAR);
  const { aviso } = await searchParams;

  const historias = await prisma.story.findMany({
    // Dentro de una misma casilla manda la más antigua. No debería haber dos
    // —las acciones no lo permiten—, pero si una fila vieja se colara, el
    // desempate tiene que ser uno que no se mueva: con la fecha de
    // modificación, ocultar o editar una de las dos las haría cambiarse de
    // casilla, y la fecha de creación no cambia nunca.
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });

  // Cada historia va a la casilla que dice su posición. Las que traen una
  // posición repetida o fuera de rango —una fila vieja, dos que se cruzaron—
  // no se esconden: caen en la primera casilla libre, y guardarlas desde ahí
  // deja su posición arreglada. Solo sobra lo que no cabe en las seis.
  const porCasilla = new Map<number, (typeof historias)[number]>();
  const desubicadas: typeof historias = [];
  for (const historia of historias) {
    const encaja =
      historia.orden >= 1 &&
      historia.orden <= MAXIMO_HISTORIAS &&
      !porCasilla.has(historia.orden);
    if (encaja) porCasilla.set(historia.orden, historia);
    else desubicadas.push(historia);
  }

  const sueltas: typeof historias = [];
  for (const historia of desubicadas) {
    const libre = CASILLAS.find((posicion) => !porCasilla.has(posicion));
    if (libre) porCasilla.set(libre, historia);
    else sueltas.push(historia);
  }

  const mensaje = aviso ? AVISOS[aviso] : undefined;

  return (
    <>
      <EncabezadoPagina
        titulo="Historias de avance"
        descripcion="Aquí se escriben las historias que representan los avances de los beneficiarios: una fotografía y el relato breve de lo que consiguieron. Saldrán en la página principal y en la de donaciones; recuerda tener siempre la aprobación de la familia antes de publicarlas."
      />

      {mensaje ? (
        <div className="mb-6">
          <MensajeFormulario tipo={mensaje.tipo}>
            {mensaje.texto}
          </MensajeFormulario>
        </div>
      ) : null}

      <ol className="space-y-4">
        {CASILLAS.map((posicion) => {
          const historia = porCasilla.get(posicion);
          const publicada = historia?.estado === "PUBLICADO";

          return (
            <li key={posicion}>
              <Tarjeta>
                {/* Plegada, la casilla enseña lo justo para saber qué hay en
                    ella: el título, de quién es, si está en la portada y
                    cuándo se tocó por última vez. */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5">
                  <Numero posicion={posicion} ocupada={Boolean(historia)} />

                  <div className="min-w-0 flex-1">
                    {historia ? (
                      <>
                        <h2 className="font-heading text-lg font-semibold text-ink">
                          {historia.titulo}
                        </h2>
                        <p className="mt-1 text-sm text-ink-soft">
                          {historia.protagonista} · Modificada el{" "}
                          {formatFechaHora(historia.updatedAt)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="font-heading text-lg font-semibold text-ink-soft">
                          Casilla vacía
                        </h2>
                        <p className="mt-1 text-sm text-ink-soft">
                          Esta posición de la portada todavía no tiene historia.
                        </p>
                      </>
                    )}
                  </div>

                  {historia ? (
                    publicada ? (
                      <Chip tono="ok">En la portada</Chip>
                    ) : (
                      <Chip tono="warn">Oculta de la portada</Chip>
                    )
                  ) : (
                    <Chip tono="neutro">Sin historia</Chip>
                  )}
                </div>

                {/* Los botones se ven siempre; lo que se despliega al pulsar
                    «Editar» es el formulario. `name` en el <details> hace que
                    abrir una casilla cierre la anterior, sin JavaScript. */}
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
                  <details
                    name="casilla-historia"
                    className="open:order-last open:w-full"
                  >
                    <summary
                      className={`${claseDisparador} border-transparent bg-brand-primary text-white shadow-suave hover:bg-brand-dark`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Editar
                      <span className="visually-hidden">
                        {" "}
                        la casilla {posicion}
                        {historia ? `: ${historia.titulo}` : " y escribir su historia"}
                      </span>
                    </summary>

                    <div className="pt-5">
                      {historia ? (
                        <FormularioHistoria
                          accion={actualizarHistoria}
                          posicion={posicion}
                          valores={{
                            id: historia.id,
                            titulo: historia.titulo,
                            protagonista: historia.protagonista,
                            programa: historia.programa ?? "",
                            resumen: historia.resumen,
                            // El relato largo se duplica del breve cuando no se
                            // escribió uno aparte: ahí no hay nada que editar.
                            contenido:
                              historia.contenido === historia.resumen
                                ? ""
                                : historia.contenido,
                            imagenAlt: historia.imagenAlt ?? "",
                            estado: historia.estado,
                            imagen: urlImagenHistoria(historia),
                            imagenDescripcion: textoAlternativo(historia),
                          }}
                        />
                      ) : (
                        <FormularioHistoria
                          accion={crearHistoria}
                          posicion={posicion}
                        />
                      )}
                    </div>
                  </details>

                  {historia ? (
                    <>
                      <form action={alternarVisibilidadHistoria}>
                        <input type="hidden" name="id" value={historia.id} />
                        <Boton type="submit" variante="contorno">
                          {publicada
                            ? "Ocultar de la portada"
                            : "Mostrar en la portada"}
                          <span className="visually-hidden">
                            {" "}
                            la historia de la casilla {posicion}
                          </span>
                        </Boton>
                      </form>

                      <ConfirmarVaciado
                        id={historia.id}
                        posicion={posicion}
                        titulo={historia.titulo}
                        className="sm:ml-auto"
                      />
                    </>
                  ) : null}
                </div>
              </Tarjeta>
            </li>
          );
        })}
      </ol>

      {sueltas.length > 0 ? (
        <section className="mt-10" aria-labelledby="sueltas-titulo">
          <h2
            id="sueltas-titulo"
            className="font-heading text-xl font-semibold text-ink"
          >
            Historias sin casilla
          </h2>
          <p className="medida-lectura mt-2 text-sm text-ink-soft">
            Hay más historias guardadas que casillas en la portada, así que
            estas se quedaron fuera y no se ven en el sitio. Elimina las que
            sobren o libera una casilla arriba.
          </p>
          <ul className="mt-4 space-y-3">
            {sueltas.map((historia) => (
              <li key={historia.id}>
                <Tarjeta className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{historia.titulo}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {historia.protagonista} · posición {historia.orden} ·
                      Modificada el {formatFechaHora(historia.updatedAt)}
                    </p>
                  </div>
                  <ConfirmarVaciado
                    id={historia.id}
                    titulo={historia.titulo}
                  />
                </Tarjeta>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** El número de la casilla, que es lo que ancla la fila. */
function Numero({
  posicion,
  ocupada,
}: {
  posicion: number;
  ocupada: boolean;
}): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-full font-heading text-lg font-semibold ${
        ocupada
          ? "bg-brand-sky text-brand-dark"
          : "border border-dashed border-line text-ink-soft"
      }`}
    >
      {posicion}
    </span>
  );
}

/**
 * «Vaciar casilla» y, dentro, la confirmación. Es la única acción que borra: se
 * lleva el texto y la fotografía y deja la posición como estaba antes de que
 * nadie escribiera nada. Ocultar de la portada no toca ningún dato.
 *
 * Un `<details>` y no un diálogo: sigue sin hacer falta JavaScript y el botón
 * queda a la vista, como los demás.
 */
function ConfirmarVaciado({
  id,
  posicion,
  titulo,
  className,
}: {
  id: string;
  /** Sin casilla —una historia que no cabe en las seis— solo cabe eliminarla. */
  posicion?: number;
  titulo: string;
  className?: string;
}): ReactNode {
  const etiqueta = posicion ? "Vaciar casilla" : "Eliminar";
  return (
    <details className={`open:w-full ${className ?? ""}`}>
      <summary
        className={`${claseDisparador} border-transparent bg-surface text-danger hover:bg-danger/10`}
      >
        {etiqueta}
        <span className="visually-hidden">
          {posicion ? ` ${posicion}: ${titulo}` : ` ${titulo}`}
        </span>
      </summary>
      <div className="mt-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
        <p className="medida-lectura text-sm text-ink-soft">
          Se borran «{titulo}» y su fotografía del almacenamiento
          {posicion
            ? `, y la casilla ${posicion} vuelve a quedar vacía para escribir otra historia`
            : ""}
          . No se puede recuperar: lo único que queda es el registro en la
          bitácora. Si solo quieres que deje de verse en el sitio, usa «Ocultar
          de la portada».
        </p>
        <form action={vaciarCasilla} className="mt-3">
          <input type="hidden" name="id" value={id} />
          <Boton type="submit" variante="peligro" className="px-4 py-2 text-sm">
            Sí, {posicion ? "vaciar la casilla" : "eliminar"}
          </Boton>
        </form>
      </div>
    </details>
  );
}
