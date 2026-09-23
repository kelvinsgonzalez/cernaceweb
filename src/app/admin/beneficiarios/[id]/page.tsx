import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  Eye,
  Images,
  KeyRound,
  FileText,
  HeartPulse,
  History,
  Home,
  Lock,
  Pencil,
  PlusCircle,
  ShieldCheck,
  Stethoscope,
  Target,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { porcentaje, resumenCompromiso } from "@/lib/aportes";
import { registrarAuditoria, requirePermiso, tienePermiso } from "@/lib/sesion";
import {
  actualizarDocumento,
  actualizarTerapia,
  agregarTerapia,
  comentarAvance,
  eliminarDocumento,
  eliminarTerapia,
  subirDocumento,
} from "../acciones";
import { FormularioComentario } from "./comentarios";
import { CATEGORIAS_DOCUMENTO, FormularioDocumento } from "./documentos";
import { FormularioTerapia } from "./terapias";
import { TAMANO_MAXIMO_DOCUMENTO } from "@/lib/almacenamiento";
import { EstadosCabecera } from "./estados";
import { PERMISOS } from "@/lib/rbac";
import {
  AccesoRestringido,
  Campo,
  Chip,
  ChipVulnerabilidad,
  EnlaceBoton,
  Progreso,
  Tarjeta,
  TarjetaCabecera,
  Vacio,
} from "@/components/ui";
import { Celda, Fila, FilaVacia, Tabla } from "@/components/admin/estructura";
import {
  MenuAcciones,
  OpcionConfirmada,
} from "@/components/admin/menu-acciones";
import {
  calcularEdad,
  fechaParaInput,
  formatFecha,
  formatFechaHora,
  formatQuetzales,
} from "@/lib/fechas";
import {
  aNumero,
  formatTamano,
  iniciales,
  primerNombre,
  urlFotoBeneficiario,
} from "@/lib/utils";
import { FotoBeneficiario } from "@/components/foto-beneficiario";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const b = await prisma.beneficiario.findUnique({
    where: { id },
    select: { nombres: true, apellidos: true },
  });
  return { title: b ? `${b.nombres} ${b.apellidos}` : "Expediente" };
}

const SECCIONES = [
  { id: "generales", etiqueta: "Datos generales" },
  { id: "terapias", etiqueta: "Terapias" },
  { id: "fotografias", etiqueta: "Fotografías" },
  { id: "inscripciones", etiqueta: "Inscripciones" },
  { id: "clinico", etiqueta: "Expediente clínico" },
  { id: "socioeconomico", etiqueta: "Ficha socioeconómica" },
  { id: "documentos", etiqueta: "Documentos" },
  { id: "terapia", etiqueta: "Plan y equipo" },
  { id: "avances", etiqueta: "Avances de seguimiento" },
  { id: "auditoria", etiqueta: "Historial de auditoría" },
];

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requirePermiso(PERMISOS.EXPEDIENTE_LEER);

  const puedeClinico = tienePermiso(usuario, PERMISOS.EXPEDIENTE_CLINICO_LEER);
  const puedeSocio = tienePermiso(
    usuario,
    PERMISOS.EXPEDIENTE_SOCIOECONOMICO_LEER,
  );
  const puedeEditarClinico = tienePermiso(
    usuario,
    PERMISOS.EXPEDIENTE_CLINICO_ESCRIBIR,
  );
  const puedeEditarSocio = tienePermiso(
    usuario,
    PERMISOS.EXPEDIENTE_SOCIOECONOMICO_ESCRIBIR,
  );
  const puedeDocumentos = tienePermiso(usuario, PERMISOS.DOCUMENTOS_LEER);
  const puedeSeguimiento = tienePermiso(usuario, PERMISOS.SEGUIMIENTO_LEER);
  const puedeEditar = tienePermiso(usuario, PERMISOS.EXPEDIENTE_ESCRIBIR);
  const puedeRegistrarAvance = tienePermiso(
    usuario,
    PERMISOS.SEGUIMIENTO_ESCRIBIR,
  );
  const puedeAuditoria = tienePermiso(usuario, PERMISOS.AUDITORIA_LEER);
  const puedeGestionarTerapia = tienePermiso(usuario, PERMISOS.TERAPIA_GESTIONAR);
  const puedePublicar = tienePermiso(usuario, PERMISOS.GALERIA_PUBLICAR);
  const puedeSubirDocumentos = tienePermiso(usuario, PERMISOS.DOCUMENTOS_SUBIR);
  const puedeDarAcceso = tienePermiso(usuario, PERMISOS.BENEFICIARIO_ACCESO);
  const puedeTerapias = puedeEditar || puedeEditarClinico;

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    include: {
      terapias: {
        orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
        select: { id: true, nombre: true, detalle: true },
      },
      encargado: true,
      plan: true,
      responsables: {
        where: { activo: true },
        select: {
          id: true,
          desde: true,
          terapeuta: { select: { id: true, nombre: true, cargo: true } },
        },
        orderBy: { desde: "asc" },
      },
      padrinazgos: {
        where: { activo: true },
        include: { padrino: { select: { id: true, nombre: true, email: true } } },
      },
      citas: {
        where: { fecha: { gte: new Date() } },
        orderBy: { fecha: "asc" },
        take: 1,
      },
      fotosExpediente: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          descripcion: true,
          visibleParaPadrino: true,
          subidaPor: true,
          createdAt: true,
        },
      },
      // Contar secciones da la completitud sin traer contenido sensible.
      _count: { select: { documentos: true, seguimientos: true, evaluaciones: true } },
    },
  });

  if (!beneficiario) notFound();

  // Si el rol no puede leerlos, la consulta no se ejecuta y el dato no llega al HTML.
  const clinico = puedeClinico
    ? await prisma.expedienteClinico.findUnique({ where: { beneficiarioId: id } })
    : null;
  const evaluaciones = puedeClinico
    ? await prisma.evaluacionClinica.findMany({
        where: { beneficiarioId: id },
        orderBy: { fecha: "desc" },
      })
    : [];
  const socio = puedeSocio
    ? await prisma.fichaSocioeconomica.findUnique({
        where: { beneficiarioId: id },
      })
    : null;
  const documentos = puedeDocumentos
    ? await prisma.documento.findMany({
        where: { beneficiarioId: id },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const avances = puedeSeguimiento
    ? await prisma.seguimiento.findMany({
        where: { beneficiarioId: id },
        include: {
          fotos: { select: { id: true } },
          comentarios: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { fecha: "desc" },
      })
    : [];
  const inscripciones = await prisma.inscripcion.findMany({
    where: { beneficiarioId: id },
    select: {
      id: true,
      ciclo: true,
      fechaInscripcion: true,
      tipoIngreso: true,
      fechaPrimerIngreso: true,
      referidoPor: true,
      areaServicio: true,
      responsableInscripcion: true,
      voBo: true,
    },
    orderBy: { ciclo: "desc" },
  });
  const clinicoDeInscripcion = puedeClinico
    ? new Map(
        (
          await prisma.inscripcion.findMany({
            where: { beneficiarioId: id },
            select: { id: true, impresionClinica: true, otrasEnfermedades: true },
          })
        ).map((i) => [i.id, i]),
      )
    : null;

  const bitacora = puedeAuditoria
    ? await prisma.auditLog.findMany({
        where: { entidadId: id },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
    : [];

  const [hayClinico, haySocio] = await Promise.all([
    prisma.expedienteClinico.count({ where: { beneficiarioId: id } }),
    prisma.fichaSocioeconomica.count({ where: { beneficiarioId: id } }),
  ]);

  const criterios = [
    Boolean(beneficiario.cui),
    Boolean(beneficiario.direccion),
    hayClinico > 0,
    haySocio > 0,
    beneficiario._count.documentos >= 3,
    beneficiario._count.evaluaciones > 0,
    beneficiario._count.seguimientos > 0,
  ];
  const completitud = (criterios.filter(Boolean).length / criterios.length) * 100;

  const nombreCompleto = `${beneficiario.nombres} ${beneficiario.apellidos}`;
  const padrinazgo = beneficiario.padrinazgos[0];
  const proximaCita = beneficiario.citas[0];

  // Lo financiero del compromiso (referencia, barra del mes, aportes y
  // mensajes) lo ve solo quien lee donaciones: el resto ve el nombre.
  const puedeVerAportes = tienePermiso(usuario, PERMISOS.DONACIONES_LEER);
  const compromiso =
    padrinazgo && puedeVerAportes ? await resumenCompromiso(padrinazgo.id) : null;
  const mensajesPadrino =
    padrinazgo && puedeVerAportes
      ? await prisma.donacion.findMany({
          where: { beneficiarioId: beneficiario.id, mensaje: { not: null }, estado: "COMPLETADA" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, mensaje: true, mensajeVisibleFamilia: true, createdAt: true },
        })
      : [];

  await registrarAuditoria({
    actor: usuario.email,
    accion: "VER_EXPEDIENTE",
    entidad: "Beneficiario",
    entidadId: beneficiario.id,
    detalle: `Consulta del expediente ${beneficiario.codigoExpediente}`,
  });

  return (
    <>
      {/* Cabecera */}
      <Tarjeta className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-5">
            {beneficiario.fotoArchivo ? (
              <FotoBeneficiario
                nombre={primerNombre(beneficiario.nombres)}
                fotoUrl={urlFotoBeneficiario(
                  beneficiario.id,
                  beneficiario.fotoArchivo,
                )}
                tamano={80}
                sinOptimizar
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-sky font-heading text-2xl font-semibold tracking-tight text-brand-dark"
              >
                {iniciales(beneficiario.nombres, beneficiario.apellidos)}
              </span>
            )}
            <div>
              <p className="font-mono text-xs text-ink-soft">
                {beneficiario.codigoExpediente}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
                  {nombreCompleto}
                </h1>
                {padrinazgo ? (
                  <Chip tono="ok">Padrino: {padrinazgo.padrino.nombre}</Chip>
                ) : (
                  <Chip tono="warn">Sin padrino asignado</Chip>
                )}
              </div>
              {/* Los dos estados se cambian aquí mismo: el chip es el botón. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EstadosCabecera
                  id={beneficiario.id}
                  estado={beneficiario.estado}
                  estadoExpediente={beneficiario.estadoExpediente}
                  editable={puedeEditar}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {puedeEditar ? (
              <EnlaceBoton
                href={`/admin/beneficiarios/${beneficiario.id}/editar`}
                variante="contorno"
              >
                <Pencil aria-hidden="true" className="size-4" />
                Editar datos
              </EnlaceBoton>
            ) : null}
            {puedeEditar ? (
              <EnlaceBoton
                href={`/admin/beneficiarios/${beneficiario.id}/fotos`}
                variante="contorno"
              >
                <Images aria-hidden="true" className="size-4" />
                Fotografías
              </EnlaceBoton>
            ) : null}
            {puedeDarAcceso ? (
              <EnlaceBoton
                href={`/admin/beneficiarios/${beneficiario.id}/acceso`}
                variante="contorno"
              >
                <KeyRound aria-hidden="true" className="size-4" />
                Acceso de la familia
              </EnlaceBoton>
            ) : null}
            {puedePublicar ? (
              <EnlaceBoton
                href={`/admin/beneficiarios/${beneficiario.id}/publicacion`}
                variante="contorno"
              >
                <Eye aria-hidden="true" className="size-4" />
                Publicación
              </EnlaceBoton>
            ) : null}
            {puedeRegistrarAvance ? (
              <EnlaceBoton href={`/admin/beneficiarios/${beneficiario.id}/avance`}>
                <PlusCircle aria-hidden="true" className="size-4" />
                Registrar avance
              </EnlaceBoton>
            ) : null}
          </div>
        </div>
      </Tarjeta>

      {/* Índice */}
      <nav aria-label="Secciones del expediente" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {SECCIONES.map((seccion) => (
            <li key={seccion.id}>
              <a
                href={`#${seccion.id}`}
                className="inline-block rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:border-brand-primary hover:text-brand-primary"
              >
                {seccion.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Datos generales */}
          <section id="generales" aria-labelledby="generales-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="generales-titulo"
                titulo="Datos generales"
                icono={<UserRound className="size-5" />}
              />
              <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Código de expediente">
                  {beneficiario.codigoExpediente}
                </Campo>
                <Campo etiqueta="Nombres">{beneficiario.nombres}</Campo>
                <Campo etiqueta="Apellidos">{beneficiario.apellidos}</Campo>
                <Campo etiqueta="Fecha de nacimiento">
                  {formatFecha(beneficiario.fechaNacimiento)}
                </Campo>
                <Campo etiqueta="Edad">
                  {calcularEdad(beneficiario.fechaNacimiento)} años
                </Campo>
                <Campo etiqueta="Sexo">
                  {beneficiario.sexo === "MASCULINO" ? "Masculino" : "Femenino"}
                </Campo>
                <Campo etiqueta="CUI">{beneficiario.cui}</Campo>
                <Campo etiqueta="Lugar de nacimiento">
                  {beneficiario.lugarNacimiento}
                </Campo>
                <Campo etiqueta="Idioma del hogar">{beneficiario.idiomaHogar}</Campo>
                <Campo etiqueta="Tipo de sangre">{beneficiario.tipoSangre}</Campo>
                <Campo etiqueta="Dirección">{beneficiario.direccion}</Campo>
                <Campo etiqueta="Zona o área">{beneficiario.zonaResidencia}</Campo>
                <Campo etiqueta="Sector o caserío">{beneficiario.sector}</Campo>
                <Campo etiqueta="Escolaridad">{beneficiario.escolaridad}</Campo>
                <Campo etiqueta="Teléfono">{beneficiario.telefono}</Campo>
                <Campo etiqueta="Municipio">{beneficiario.municipio}</Campo>
                <Campo etiqueta="Departamento">{beneficiario.departamento}</Campo>
                <Campo etiqueta="Fecha de ingreso">
                  {formatFecha(beneficiario.fechaIngreso)}
                </Campo>
                <Campo etiqueta="Centro de atención">
                  {beneficiario.centroAtencion}
                </Campo>
                <Campo etiqueta="Encargado">{beneficiario.encargado?.nombre}</Campo>
                <Campo etiqueta="Parentesco">
                  {beneficiario.encargado?.parentesco}
                </Campo>
                <Campo etiqueta="Teléfono del encargado">
                  {beneficiario.encargado?.telefono}
                </Campo>
                <Campo etiqueta="Correo del encargado">
                  {beneficiario.encargado?.email}
                </Campo>
                <Campo etiqueta="Pide patrocinador">
                  {beneficiario.solicitaPatrocinio
                    ? "Sí, lo pidió la familia"
                    : "No lo ha pedido"}
                </Campo>
                <Campo etiqueta="Publicación autorizada">
                  {beneficiario.publicadoEnGaleria
                    ? "Sí, sus datos y foto pueden salir en el sitio"
                    : "No"}
                </Campo>
                <Campo etiqueta="Última actualización">
                  {formatFechaHora(beneficiario.updatedAt)}
                </Campo>
              </dl>
            </Tarjeta>
          </section>

          {/* Terapias */}
          <section id="terapias" aria-labelledby="terapias-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="terapias-titulo"
                titulo="Terapias"
                descripcion="Lo que recibe este niño, en palabras del equipo. Los nombres salen en el sitio si está publicado; la explicación queda para el equipo y la familia."
                icono={<HeartPulse className="size-5" />}
                acciones={
                  <Chip tono="neutro">
                    {beneficiario.terapias.length}{" "}
                    {beneficiario.terapias.length === 1 ? "terapia" : "terapias"}
                  </Chip>
                }
              />
              {beneficiario.terapias.length === 0 ? (
                <Vacio mensaje="Todavía no hay terapias anotadas en este expediente." />
              ) : (
                <ul className="divide-y divide-line">
                  {beneficiario.terapias.map((terapia) => (
                    <li key={terapia.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{terapia.nombre}</p>
                          {terapia.detalle ? (
                            <p className="medida-lectura mt-1 whitespace-pre-line text-sm text-ink-soft">
                              {terapia.detalle}
                            </p>
                          ) : null}
                        </div>
                        {puedeTerapias ? (
                          <MenuAcciones
                            id={terapia.id}
                            etiqueta={`Acciones de ${terapia.nombre}`}
                            titulo={terapia.nombre}
                          >
                            <OpcionConfirmada
                              menu={terapia.id}
                              tono="peligro"
                              etiqueta="Quitar"
                              mensaje="La terapia desaparece del expediente y del sitio público. Los avances registrados no se tocan."
                              confirmar="Sí, quitar"
                              accion={eliminarTerapia}
                            >
                              <input type="hidden" name="id" value={terapia.id} />
                            </OpcionConfirmada>
                          </MenuAcciones>
                        ) : null}
                      </div>
                      {puedeTerapias ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-brand-dark hover:underline">
                            Corregir
                            <span className="visually-hidden"> {terapia.nombre}</span>
                          </summary>
                          <div className="mt-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
                            <FormularioTerapia
                              accion={actualizarTerapia}
                              beneficiarioId={beneficiario.id}
                              terapiaId={terapia.id}
                              valores={{
                                nombre: terapia.nombre,
                                detalle: terapia.detalle ?? "",
                              }}
                            />
                          </div>
                        </details>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {puedeTerapias ? (
                <div className="border-t border-line p-5">
                  <h3 className="mb-3 font-heading text-base font-semibold text-ink">
                    Añadir una terapia
                  </h3>
                  <FormularioTerapia
                    accion={agregarTerapia}
                    beneficiarioId={beneficiario.id}
                  />
                </div>
              ) : null}
            </Tarjeta>
          </section>

          {/* Fotografías */}
          <section id="fotografias" aria-labelledby="fotografias-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="fotografias-titulo"
                titulo="Fotografías"
                descripcion="La principal identifica el expediente y es la que sale en el sitio cuando se le busca padrino. Las de evidencia documentan el caso."
                icono={<Images className="size-5" />}
                acciones={
                  puedeEditar ? (
                    <EnlaceBoton
                      href={`/admin/beneficiarios/${beneficiario.id}/fotos`}
                      variante="contorno"
                    >
                      Gestionar fotografías
                    </EnlaceBoton>
                  ) : undefined
                }
              />
              <div className="flex flex-wrap items-start gap-6 p-5">
                <div className="flex flex-col items-center gap-2">
                  <FotoBeneficiario
                    nombre={primerNombre(beneficiario.nombres)}
                    fotoUrl={urlFotoBeneficiario(
                      beneficiario.id,
                      beneficiario.fotoArchivo,
                    )}
                    tamano={112}
                    sinOptimizar
                  />
                  <p className="text-xs font-semibold text-ink-soft">
                    {beneficiario.fotoArchivo
                      ? "Foto principal"
                      : "Sin foto principal"}
                  </p>
                </div>

                <div className="min-w-56 flex-1">
                  <h3 className="mb-3 font-heading text-base font-semibold text-ink">
                    Evidencia ({beneficiario.fotosExpediente.length})
                  </h3>
                  {beneficiario.fotosExpediente.length === 0 ? (
                    <p className="text-sm text-ink-soft">
                      Todavía no se han adjuntado fotos de evidencia.
                    </p>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {beneficiario.fotosExpediente.slice(0, 8).map((foto) => (
                        <li key={foto.id}>
                          <Image
                            src={`/api/fotos/expediente/${foto.id}`}
                            alt={
                              foto.descripcion ?? "Fotografía del expediente"
                            }
                            width={200}
                            height={150}
                            unoptimized
                            className="aspect-[4/3] w-full rounded-[var(--radius-sm)] border border-line bg-canvas object-cover"
                          />
                          {foto.visibleParaPadrino ? (
                            <span className="mt-1 block text-[11px] text-ink-soft">
                              Compartida
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Tarjeta>
          </section>

          {/* Inscripciones por ciclo */}
          <section id="inscripciones" aria-labelledby="inscripciones-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="inscripciones-titulo"
                titulo="Inscripciones"
                descripcion="Una ficha por ciclo. La más reciente es la vigente."
                icono={<ClipboardList className="size-5" />}
                acciones={
                  puedeEditar ? (
                    <EnlaceBoton
                      href={`/admin/beneficiarios/${beneficiario.id}/inscripcion`}
                      variante="contorno"
                    >
                      Llenar la ficha
                    </EnlaceBoton>
                  ) : undefined
                }
              />
              {inscripciones.length === 0 ? (
                <Vacio mensaje="Todavía no se ha llenado ninguna ficha de inscripción." />
              ) : (
                <ol className="divide-y divide-line">
                  {inscripciones.map((inscripcion) => {
                    const clinico = clinicoDeInscripcion?.get(inscripcion.id);
                    return (
                      <li key={inscripcion.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip tono="info">Ciclo {inscripcion.ciclo}</Chip>
                          {inscripcion.tipoIngreso === "PRIMER_INGRESO" ? (
                            <Chip tono="ok">Primer ingreso</Chip>
                          ) : (
                            <Chip tono="neutro">Reingreso</Chip>
                          )}
                          <Chip tono="neutro">
                            {formatFecha(inscripcion.fechaInscripcion)}
                          </Chip>
                          {puedeEditar ? (
                            <Link
                              href={`/admin/beneficiarios/${beneficiario.id}/inscripcion/${inscripcion.id}`}
                              className="ml-auto text-sm font-semibold text-brand-primary hover:underline"
                            >
                              Corregir
                              <span className="visually-hidden">
                                {" "}
                                la ficha del ciclo {inscripcion.ciclo}
                              </span>
                            </Link>
                          ) : null}
                        </div>
                        <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <Campo etiqueta="Área de servicio">
                            {inscripcion.areaServicio}
                          </Campo>
                          <Campo etiqueta="Referido por">
                            {inscripcion.referidoPor}
                          </Campo>
                          <Campo etiqueta="Primer ingreso">
                            {formatFecha(inscripcion.fechaPrimerIngreso)}
                          </Campo>
                          <Campo etiqueta="Responsable">
                            {inscripcion.responsableInscripcion}
                          </Campo>
                          <Campo etiqueta="Vo.Bo.">{inscripcion.voBo}</Campo>
                          {clinico ? (
                            <>
                              <Campo etiqueta="Impresión clínica">
                                {clinico.impresionClinica}
                              </Campo>
                              <Campo etiqueta="Otras enfermedades">
                                {clinico.otrasEnfermedades}
                              </Campo>
                            </>
                          ) : null}
                        </dl>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Tarjeta>
          </section>

          {/* Expediente clínico */}
          <section id="clinico" aria-labelledby="clinico-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="clinico-titulo"
                titulo="Expediente clínico"
                descripcion="Información confidencial. Solo la consultan los roles con permiso clínico."
                icono={<Stethoscope className="size-5" />}
                acciones={
                  <>
                    {puedeEditarClinico ? (
                      <EnlaceBoton
                        href={`/admin/beneficiarios/${beneficiario.id}/clinico`}
                        variante="contorno"
                      >
                        {clinico ? "Editar" : "Registrar"}
                      </EnlaceBoton>
                    ) : null}
                    <Chip
                      tono="bad"
                      icono={<Lock aria-hidden="true" className="size-4" />}
                    >
                      Confidencial
                    </Chip>
                  </>
                }
              />
              {!puedeClinico ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso expediente.clinico.leer, así que estos datos no se consultaron en la base y no forman parte de esta página." />
                </div>
              ) : !clinico ? (
                <Vacio mensaje="Todavía no se ha registrado el expediente clínico." />
              ) : (
                <>
                  <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Campo etiqueta="Diagnóstico principal">
                      {clinico.diagnosticoPrincipal}
                    </Campo>
                    <Campo etiqueta="Código CIE-10">{clinico.codigoCie10}</Campo>
                    <Campo etiqueta="Fecha del diagnóstico">
                      {formatFecha(clinico.fechaDiagnostico)}
                    </Campo>
                    <Campo etiqueta="Tipo de discapacidad">
                      {clinico.tipoDiscapacidad}
                    </Campo>
                    <Campo etiqueta="Grado de dependencia">
                      {clinico.gradoDependencia}
                    </Campo>
                    <Campo etiqueta="Médico tratante">{clinico.medicoTratante}</Campo>
                    <Campo etiqueta="Alergias">{clinico.alergias}</Campo>
                    <Campo etiqueta="Medicamentos">{clinico.medicamentos}</Campo>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Campo etiqueta="Antecedentes">{clinico.antecedentes}</Campo>
                    </div>
                  </dl>

                  <div className="border-t border-line p-5">
                    <h3 className="mb-3 font-heading text-base font-semibold text-ink">
                      Evaluaciones clínicas
                    </h3>
                    <Tabla
                      caption={`Evaluaciones clínicas registradas para ${nombreCompleto}`}
                      columnas={["Fecha", "Tipo", "Profesional", "Resultado", "Documento"]}
                    >
                      {evaluaciones.length === 0 ? (
                        <FilaVacia columnas={5} mensaje="Sin evaluaciones registradas." />
                      ) : (
                        evaluaciones.map((evaluacion) => (
                          <Fila key={evaluacion.id}>
                            <Celda>{formatFecha(evaluacion.fecha)}</Celda>
                            <Celda>{evaluacion.tipo}</Celda>
                            <Celda>{evaluacion.profesional}</Celda>
                            <Celda className="max-w-md">{evaluacion.resultado}</Celda>
                            <Celda>
                              {evaluacion.documento ? (
                                <span className="font-mono text-xs">
                                  {evaluacion.documento}
                                </span>
                              ) : (
                                <span className="text-ink-soft">—</span>
                              )}
                            </Celda>
                          </Fila>
                        ))
                      )}
                    </Tabla>
                  </div>
                </>
              )}
            </Tarjeta>
          </section>

          {/* Ficha socioeconómica */}
          <section id="socioeconomico" aria-labelledby="socio-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="socio-titulo"
                titulo="Ficha socioeconómica"
                descripcion="Estudio del hogar realizado por trabajo social."
                icono={<Home className="size-5" />}
                acciones={
                  puedeEditarSocio ? (
                    <EnlaceBoton
                      href={`/admin/beneficiarios/${beneficiario.id}/socioeconomico`}
                      variante="contorno"
                    >
                      {socio ? "Actualizar" : "Registrar"}
                    </EnlaceBoton>
                  ) : undefined
                }
              />
              {!puedeSocio ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso expediente.socioeconomico.leer. El ingreso del hogar y el resto del estudio no se consultaron en la base." />
                </div>
              ) : !socio ? (
                <Vacio mensaje="Todavía no se ha realizado el estudio socioeconómico." />
              ) : (
                <>
                  <div
                    className={`flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 ${
                      socio.nivelVulnerabilidad === "ALTO"
                        ? "bg-bad-bg"
                        : socio.nivelVulnerabilidad === "MEDIO"
                          ? "bg-warn-bg"
                          : "bg-ok-bg"
                    }`}
                  >
                    <ChipVulnerabilidad nivel={socio.nivelVulnerabilidad} />
                    {socio.elegibleBeca ? (
                      <Chip tono="ok">Elegible para beca</Chip>
                    ) : (
                      <Chip tono="neutro">No elegible para beca</Chip>
                    )}
                  </div>

                  <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Campo etiqueta="Integrantes del hogar">
                      {socio.integrantesHogar}
                    </Campo>
                    <Campo etiqueta="Ingreso mensual">
                      {formatQuetzales(aNumero(socio.ingresoMensual))}
                    </Campo>
                    <Campo etiqueta="Fuente de ingreso">{socio.fuenteIngreso}</Campo>
                    <Campo etiqueta="Tipo de vivienda">{socio.tipoVivienda}</Campo>
                    <Campo etiqueta="Material de construcción">
                      {socio.materialConstruccion}
                    </Campo>
                    <Campo etiqueta="Escolaridad del encargado">
                      {socio.escolaridadEncargado}
                    </Campo>
                    <Campo etiqueta="Servicios básicos">
                      <ul className="flex flex-wrap gap-1.5">
                        {socio.serviciosBasicos.map((servicio) => (
                          <li key={servicio}>
                            <Chip tono="neutro">{servicio}</Chip>
                          </li>
                        ))}
                      </ul>
                    </Campo>
                    <Campo etiqueta="Fecha del estudio">
                      {formatFecha(socio.fechaEstudio)}
                    </Campo>
                    <Campo etiqueta="Realizado por">{socio.realizadoPor}</Campo>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Campo etiqueta="Observaciones">{socio.observaciones}</Campo>
                    </div>
                  </dl>
                </>
              )}
            </Tarjeta>
          </section>

          {/* Documentos */}
          <section id="documentos" aria-labelledby="documentos-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="documentos-titulo"
                titulo="Documentos adjuntos"
                descripcion="Los marcados como compartidos son los que el padrino y la familia pueden abrir desde su portal."
                icono={<FileText className="size-5" />}
                acciones={
                  puedeDocumentos ? (
                    <Chip tono="neutro">
                      {documentos.length}{" "}
                      {documentos.length === 1 ? "documento" : "documentos"}
                    </Chip>
                  ) : undefined
                }
              />
              {!puedeDocumentos ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso documentos.leer." />
                </div>
              ) : (
                <>
                  {documentos.length === 0 ? (
                    <Vacio mensaje="Sin documentos adjuntos." />
                  ) : (
                    <ul className="divide-y divide-line">
                      {documentos.map((documento) => (
                        <li key={documento.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {documento.archivo ? (
                                <a
                                  href={`/api/documentos/${documento.id}`}
                                  target="_blank"
                                  rel="noopener"
                                  className="font-medium text-brand-dark hover:underline"
                                >
                                  {documento.nombre}
                                  <span className="visually-hidden">
                                    {" "}
                                    (se abre en una pestaña nueva)
                                  </span>
                                </a>
                              ) : (
                                <span className="font-medium text-ink">
                                  {documento.nombre}
                                </span>
                              )}
                              <p className="mt-1 text-xs text-ink-soft">
                                {documento.categoria} ·{" "}
                                {documento.archivo
                                  ? `${documento.tipoMime} · ${formatTamano(documento.tamanoBytes)}`
                                  : "registrado sin archivo adjunto"}{" "}
                                · subido por {documento.subidoPor} el{" "}
                                {formatFecha(documento.createdAt)}
                                {documento.fechaVencimiento
                                  ? ` · vence el ${formatFecha(documento.fechaVencimiento)}`
                                  : ""}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {documento.vigente ? (
                                  <Chip tono="ok">Vigente</Chip>
                                ) : (
                                  <Chip tono="bad">Vencido</Chip>
                                )}
                                {documento.visibleParaPadrino ? (
                                  <Chip tono="info">Compartido</Chip>
                                ) : (
                                  <Chip tono="neutro">Interno</Chip>
                                )}
                              </div>
                            </div>
                            {puedeSubirDocumentos ? (
                              <MenuAcciones
                                id={documento.id}
                                etiqueta={`Acciones del documento ${documento.nombre}`}
                                titulo={documento.nombre}
                              >
                                <OpcionConfirmada
                                  menu={documento.id}
                                  tono="peligro"
                                  etiqueta="Eliminar"
                                  mensaje={`Se borra «${documento.nombre}» del expediente, con su archivo. No se puede recuperar: lo único que queda es el registro en la bitácora.`}
                                  confirmar="Sí, eliminar"
                                  accion={eliminarDocumento}
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={documento.id}
                                  />
                                </OpcionConfirmada>
                              </MenuAcciones>
                            ) : null}
                          </div>
                          {puedeSubirDocumentos ? (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-brand-dark hover:underline">
                                Corregir la ficha
                                <span className="visually-hidden">
                                  {" "}
                                  de {documento.nombre}
                                </span>
                              </summary>
                              <div className="mt-3 rounded-[var(--radius-sm)] border border-line bg-canvas p-4">
                                <FormularioDocumento
                                  accion={actualizarDocumento}
                                  beneficiarioId={beneficiario.id}
                                  documentoId={documento.id}
                                  categorias={CATEGORIAS_DOCUMENTO}
                                  tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
                                  valores={{
                                    nombre: documento.nombre,
                                    categoria: documento.categoria,
                                    fechaVencimiento: documento.fechaVencimiento
                                      ? fechaParaInput(documento.fechaVencimiento)
                                      : "",
                                    visibleParaPadrino: documento.visibleParaPadrino,
                                  }}
                                />
                              </div>
                            </details>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  {puedeSubirDocumentos ? (
                    <div className="border-t border-line p-5">
                      <h3 className="mb-3 font-heading text-base font-semibold text-ink">
                        Adjuntar un documento
                      </h3>
                      <FormularioDocumento
                        accion={subirDocumento}
                        beneficiarioId={beneficiario.id}
                        categorias={CATEGORIAS_DOCUMENTO}
                        tamanoMaximoMb={TAMANO_MAXIMO_DOCUMENTO / (1024 * 1024)}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </Tarjeta>
          </section>

          {/* Plan de terapia y equipo responsable */}
          <section id="terapia" aria-labelledby="terapia-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="terapia-titulo"
                titulo="Plan de terapia y equipo"
                descripcion="El objetivo general lo fija la administración al aprobar la terapia; los responsables son quienes pueden registrar avances."
                icono={<Target className="size-5" />}
                acciones={
                  puedeGestionarTerapia ? (
                    <EnlaceBoton
                      href={`/admin/beneficiarios/${beneficiario.id}/terapia`}
                      variante="contorno"
                    >
                      {beneficiario.plan ? "Editar plan" : "Aprobar terapia"}
                    </EnlaceBoton>
                  ) : undefined
                }
              />
              {!puedeSeguimiento ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso seguimiento.leer." />
                </div>
              ) : !beneficiario.plan ? (
                <Vacio mensaje="Todavía no se ha aprobado la terapia de este beneficiario." />
              ) : (
                <div className="space-y-5 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {beneficiario.plan.activo ? (
                      <Chip tono="ok">
                        Aprobado el {formatFecha(beneficiario.plan.fechaAprobacion)}
                      </Chip>
                    ) : (
                      <Chip tono="warn">Plan suspendido</Chip>
                    )}
                    <Chip tono="neutro">Por {beneficiario.plan.aprobadoPor}</Chip>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Objetivo general
                    </h3>
                    <p className="medida-lectura mt-1 text-sm text-ink">
                      {beneficiario.plan.objetivoGeneral}
                    </p>
                  </div>

                  {beneficiario.plan.anotaciones ? (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Anotaciones para el equipo
                      </h3>
                      <p className="medida-lectura mt-1 text-sm text-ink-soft">
                        {beneficiario.plan.anotaciones}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Equipo responsable
                    </h3>
                    {beneficiario.responsables.length === 0 ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        Sin responsables asignados: nadie puede registrarle
                        avances todavía.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {beneficiario.responsables.map((r) => (
                          <li key={r.id}>
                            <Chip tono="info">
                              {r.terapeuta.nombre}
                              {r.terapeuta.cargo ? ` · ${r.terapeuta.cargo}` : ""}
                            </Chip>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </Tarjeta>
          </section>

          {/* Avances */}
          <section id="avances" aria-labelledby="avances-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="avances-titulo"
                titulo="Avances de seguimiento"
                descripcion="Los avances marcados como visibles son los que el padrino ve en su portal."
                icono={<ClipboardList className="size-5" />}
                acciones={
                  puedeRegistrarAvance ? (
                    <EnlaceBoton
                      href={`/admin/beneficiarios/${beneficiario.id}/avance`}
                      variante="contorno"
                    >
                      Registrar avance
                    </EnlaceBoton>
                  ) : undefined
                }
              />
              {!puedeSeguimiento ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso seguimiento.leer." />
                </div>
              ) : avances.length === 0 ? (
                <Vacio mensaje="Todavía no hay avances registrados." />
              ) : (
                <ol className="divide-y divide-line">
                  {avances.map((avance) => (
                    <li key={avance.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tono="neutro">{formatFecha(avance.fecha)}</Chip>
                        <Chip tono="info">{avance.area}</Chip>
                        {avance.visibleParaPadrino ? (
                          <Chip tono="ok">Visible para el padrino</Chip>
                        ) : (
                          <Chip tono="warn">Solo uso interno</Chip>
                        )}
                        {puedeRegistrarAvance ? (
                          <Link
                            href={`/admin/beneficiarios/${beneficiario.id}/avance/${avance.id}`}
                            className="ml-auto text-sm font-semibold text-brand-primary hover:underline"
                          >
                            Corregir
                            <span className="visually-hidden">
                              {" "}
                              el avance «{avance.titulo}»
                            </span>
                          </Link>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-heading text-base font-semibold text-ink">
                        {avance.titulo}
                      </h3>
                      <p className="medida-lectura mt-1 text-sm text-ink-soft">
                        {avance.descripcion}
                      </p>
                      {avance.fotos.length > 0 ? (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {avance.fotos.map((foto) => (
                            <li key={foto.id}>
                              {/* Sin optimizar: el optimizador de Next pediría
                                  la imagen sin la sesión y recibiría un 404. */}
                              <Image
                                src={`/api/fotos/${foto.id}`}
                                alt=""
                                width={160}
                                height={160}
                                unoptimized
                                className="size-24 rounded-[var(--radius-sm)] border border-line object-cover"
                              />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-2 text-xs text-ink-soft">
                        Registrado por {avance.registradoPor}
                      </p>

                      <div className="mt-3 border-t border-line pt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          Comentarios del equipo
                          {avance.comentarios.length > 0
                            ? ` (${avance.comentarios.length})`
                            : ""}
                        </h4>
                        {avance.comentarios.length === 0 ? (
                          <p className="mt-1 text-sm text-ink-soft">
                            Todavía nadie ha comentado este avance.
                          </p>
                        ) : (
                          <ol className="mt-2 space-y-2">
                            {avance.comentarios.map((comentario) => (
                              <li
                                key={comentario.id}
                                className="rounded-[var(--radius-sm)] bg-canvas px-3 py-2"
                              >
                                <p className="medida-lectura text-sm text-ink">
                                  {comentario.texto}
                                </p>
                                <p className="mt-1 text-xs text-ink-soft">
                                  {comentario.autor} ·{" "}
                                  {formatFechaHora(comentario.createdAt)}
                                </p>
                              </li>
                            ))}
                          </ol>
                        )}
                        {puedeRegistrarAvance ? (
                          <FormularioComentario
                            accion={comentarAvance}
                            seguimientoId={avance.id}
                            titulo={avance.titulo}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Tarjeta>
          </section>

          {/* Auditoría */}
          <section id="auditoria" aria-labelledby="auditoria-titulo">
            <Tarjeta>
              <TarjetaCabecera
                id="auditoria-titulo"
                titulo="Historial de auditoría"
                descripcion="Cada apertura y cada cambio de este expediente queda registrado."
                icono={<History className="size-5" />}
              />
              {!puedeAuditoria ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso auditoria.leer." />
                </div>
              ) : (
                <div className="p-5">
                  <Tabla
                    caption={`Movimientos registrados sobre el expediente de ${nombreCompleto}`}
                    columnas={["Fecha y hora", "Actor", "Acción", "Detalle"]}
                  >
                    {bitacora.length === 0 ? (
                      <FilaVacia columnas={4} mensaje="Sin movimientos registrados." />
                    ) : (
                      bitacora.map((entrada) => (
                        <Fila key={entrada.id}>
                          <Celda className="whitespace-nowrap">
                            {formatFechaHora(entrada.createdAt)}
                          </Celda>
                          <Celda>{entrada.actor}</Celda>
                          <Celda>
                            <Chip tono="neutro">{entrada.accion}</Chip>
                          </Celda>
                          <Celda className="max-w-md">{entrada.detalle}</Celda>
                        </Fila>
                      ))
                    )}
                  </Tabla>
                </div>
              )}
            </Tarjeta>
          </section>
        </div>

        {/* Columna lateral */}
        <aside aria-label="Resumen del expediente" className="space-y-5">
          <Tarjeta className="p-5">
            <Progreso valor={completitud} etiqueta="Completitud del expediente" />
            <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <li>{beneficiario._count.documentos} documentos adjuntos</li>
              <li>{beneficiario._count.evaluaciones} evaluaciones clínicas</li>
              <li>{beneficiario._count.seguimientos} avances registrados</li>
            </ul>
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="font-heading text-base font-semibold text-ink">
              Padrino asignado
            </h2>
            {padrinazgo ? (
              <dl className="mt-3 space-y-3">
                <Campo etiqueta="Nombre">
                  {puedeVerAportes ? (
                    <Link
                      href={`/admin/donantes/${padrinazgo.padrino.id}`}
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      {padrinazgo.padrino.nombre}
                    </Link>
                  ) : (
                    padrinazgo.padrino.nombre
                  )}
                </Campo>
                <Campo etiqueta="Desde">{formatFecha(padrinazgo.fechaInicio)}</Campo>
                {padrinazgo.caducaEl ? (
                  <Campo etiqueta="Compromiso hasta">{formatFecha(padrinazgo.caducaEl)}</Campo>
                ) : null}
                {compromiso ? (
                  <>
                    <Campo etiqueta="Aporte de referencia">
                      {formatQuetzales(aNumero(padrinazgo.aporteMensual))} al mes
                    </Campo>
                    <div>
                      <Progreso
                        valor={porcentaje(compromiso.aportadoMes, aNumero(padrinazgo.aporteMensual))}
                        etiqueta="Este mes"
                      />
                      <p className="mt-1 text-xs text-ink-soft">
                        {formatQuetzales(compromiso.aportadoMes)} este mes · {formatQuetzales(compromiso.totalAportado)} en total
                      </p>
                    </div>
                    <Campo etiqueta="Último aporte">
                      {compromiso.ultimoAporte ? formatFecha(compromiso.ultimoAporte) : "Ninguno"}
                      {compromiso.pendientes > 0 ? ` · ${compromiso.pendientes} por verificar` : ""}
                    </Campo>
                    {padrinazgo.avancesSuspendidos ? (
                      <Chip tono="warn">Avances suspendidos para el padrino</Chip>
                    ) : null}
                    {mensajesPadrino.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          Mensajes de amor
                        </p>
                        <ul className="mt-2 space-y-2">
                          {mensajesPadrino.map((m) => (
                            <li key={m.id} className="rounded-[var(--radius-sm)] bg-brand-sky p-3 text-xs text-brand-dark">
                              «{m.mensaje}»
                              <span className="mt-1 block text-ink-soft">
                                {formatFecha(m.createdAt)} · {m.mensajeVisibleFamilia ? "publicado a la familia" : "sin publicar"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Sin padrino asignado. Aparece en la galería pública si está
                marcado como publicado.
              </p>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
              <CalendarClock aria-hidden="true" className="size-4 text-brand-primary" />
              Próxima cita
            </h2>
            {proximaCita ? (
              <dl className="mt-3 space-y-3">
                <Campo etiqueta="Fecha y hora">
                  {formatFechaHora(proximaCita.fecha)}
                </Campo>
                <Campo etiqueta="Tipo">{proximaCita.tipo}</Campo>
                <Campo etiqueta="Profesional">{proximaCita.profesional}</Campo>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Sin citas programadas.</p>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="font-heading text-base font-semibold text-ink">
              Acciones rápidas
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {puedeEditar ? (
                <li>
                  <Link
                    href={`/admin/beneficiarios/${beneficiario.id}/editar`}
                    className="font-semibold text-brand-primary hover:underline"
                  >
                    Editar datos generales
                  </Link>
                </li>
              ) : null}
              {puedeRegistrarAvance ? (
                <li>
                  <Link
                    href={`/admin/beneficiarios/${beneficiario.id}/avance`}
                    className="font-semibold text-brand-primary hover:underline"
                  >
                    Registrar un avance
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href="/admin/beneficiarios"
                  className="font-semibold text-brand-primary hover:underline"
                >
                  Volver al listado
                </Link>
              </li>
            </ul>
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
              <ShieldCheck aria-hidden="true" className="size-4 text-brand-primary" />
              Tu acceso a este expediente
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-ink-soft">Datos clínicos</span>
                {puedeClinico ? <Chip tono="ok">Visible</Chip> : <Chip tono="bad">Oculto</Chip>}
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-ink-soft">Ficha socioeconómica</span>
                {puedeSocio ? <Chip tono="ok">Visible</Chip> : <Chip tono="bad">Oculto</Chip>}
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-ink-soft">Documentos</span>
                {puedeDocumentos ? <Chip tono="ok">Visible</Chip> : <Chip tono="bad">Oculto</Chip>}
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-ink-soft">Avances</span>
                {puedeSeguimiento ? <Chip tono="ok">Visible</Chip> : <Chip tono="bad">Oculto</Chip>}
              </li>
            </ul>
            <p className="medida-lectura mt-4 flex items-start gap-2 text-xs text-ink-soft">
              <HeartPulse aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Lo marcado como oculto no se consulta en la base de datos: no está
              escondido con CSS, sencillamente no forma parte de esta página.
            </p>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
