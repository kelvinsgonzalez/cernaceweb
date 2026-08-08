import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  FileText,
  HeartPulse,
  History,
  Home,
  Lock,
  Pencil,
  PlusCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, requirePermiso, tienePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import {
  AccesoRestringido,
  Campo,
  Chip,
  ChipEstadoBeneficiario,
  ChipEstadoExpediente,
  ChipVulnerabilidad,
  EnlaceBoton,
  Progreso,
  Tarjeta,
  TarjetaCabecera,
  Vacio,
} from "@/components/ui";
import { Celda, Fila, FilaVacia, Tabla } from "@/components/admin/estructura";
import {
  calcularEdad,
  formatFecha,
  formatFechaHora,
  formatQuetzales,
} from "@/lib/fechas";
import { aNumero, formatTamano, iniciales } from "@/lib/utils";

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
  { id: "clinico", etiqueta: "Expediente clínico" },
  { id: "socioeconomico", etiqueta: "Ficha socioeconómica" },
  { id: "documentos", etiqueta: "Documentos" },
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
  const puedeDocumentos = tienePermiso(usuario, PERMISOS.DOCUMENTOS_LEER);
  const puedeSeguimiento = tienePermiso(usuario, PERMISOS.SEGUIMIENTO_LEER);
  const puedeEditar = tienePermiso(usuario, PERMISOS.EXPEDIENTE_ESCRIBIR);
  const puedeRegistrarAvance = tienePermiso(
    usuario,
    PERMISOS.SEGUIMIENTO_ESCRIBIR,
  );
  const puedeAuditoria = tienePermiso(usuario, PERMISOS.AUDITORIA_LEER);

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    include: {
      programa: { select: { nombre: true } },
      padrinazgos: {
        where: { activo: true },
        include: { padrino: { select: { nombre: true, email: true } } },
      },
      citas: {
        where: { fecha: { gte: new Date() } },
        orderBy: { fecha: "asc" },
        take: 1,
      },
      // Se cuentan las secciones para calcular la completitud sin traer su
      // contenido: saber que existe una ficha no revela lo que dice.
      _count: { select: { documentos: true, seguimientos: true, evaluaciones: true } },
    },
  });

  if (!beneficiario) notFound();

  // Bloques sensibles: si el rol no puede leerlos, la consulta ni siquiera se
  // ejecuta, de modo que el dato no llega al HTML.
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
        orderBy: { fecha: "desc" },
      })
    : [];
  const bitacora = puedeAuditoria
    ? await prisma.auditLog.findMany({
        where: { entidadId: id },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
    : [];

  // Existencia de las fichas, para la barra de completitud.
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
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-sky font-heading text-2xl font-bold text-brand-dark"
            >
              {iniciales(beneficiario.nombres, beneficiario.apellidos)}
            </span>
            <div>
              <p className="font-mono text-xs text-ink-soft">
                {beneficiario.codigoExpediente}
              </p>
              <h1 className="font-heading text-3xl font-bold text-ink">
                {nombreCompleto}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <ChipEstadoBeneficiario estado={beneficiario.estado} />
                <ChipEstadoExpediente estado={beneficiario.estadoExpediente} />
                <Chip tono="info">{beneficiario.programa.nombre}</Chip>
                {padrinazgo ? (
                  <Chip tono="ok">Padrino: {padrinazgo.padrino.nombre}</Chip>
                ) : (
                  <Chip tono="warn">Sin padrino asignado</Chip>
                )}
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
                <Campo etiqueta="Municipio">{beneficiario.municipio}</Campo>
                <Campo etiqueta="Departamento">{beneficiario.departamento}</Campo>
                <Campo etiqueta="Fecha de ingreso">
                  {formatFecha(beneficiario.fechaIngreso)}
                </Campo>
                <Campo etiqueta="Programa">{beneficiario.programa.nombre}</Campo>
                <Campo etiqueta="Encargado">{beneficiario.encargadoNombre}</Campo>
                <Campo etiqueta="Parentesco">
                  {beneficiario.encargadoParentesco}
                </Campo>
                <Campo etiqueta="Teléfono del encargado">
                  {beneficiario.encargadoTelefono}
                </Campo>
                <Campo etiqueta="Correo del encargado">
                  {beneficiario.encargadoEmail}
                </Campo>
                <Campo etiqueta="Publicado en la galería">
                  {beneficiario.publicadoEnGaleria ? "Sí" : "No"}
                </Campo>
                <Campo etiqueta="Última actualización">
                  {formatFechaHora(beneficiario.updatedAt)}
                </Campo>
              </dl>
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
                acciones={<Chip tono="bad" icono={<Lock aria-hidden="true" className="size-4" />}>Confidencial</Chip>}
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
                    <Campo etiqueta="Terapias">
                      <ul className="flex flex-wrap gap-1.5">
                        {clinico.terapias.map((terapia) => (
                          <li key={terapia}>
                            <Chip tono="info">{terapia}</Chip>
                          </li>
                        ))}
                      </ul>
                    </Campo>
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
                icono={<FileText className="size-5" />}
              />
              {!puedeDocumentos ? (
                <div className="p-5">
                  <AccesoRestringido mensaje="Tu rol no incluye el permiso documentos.leer." />
                </div>
              ) : (
                <div className="p-5">
                  <Tabla
                    caption={`Documentos adjuntos al expediente de ${nombreCompleto}`}
                    columnas={["Documento", "Categoría", "Tamaño", "Vence", "Estado", "Subido por"]}
                  >
                    {documentos.length === 0 ? (
                      <FilaVacia columnas={6} mensaje="Sin documentos adjuntos." />
                    ) : (
                      documentos.map((documento) => (
                        <Fila key={documento.id}>
                          <Celda>
                            <span className="font-medium">{documento.nombre}</span>
                            <span className="block font-mono text-xs text-ink-soft">
                              {documento.tipoMime}
                            </span>
                          </Celda>
                          <Celda>{documento.categoria}</Celda>
                          <Celda>{formatTamano(documento.tamanoBytes)}</Celda>
                          <Celda>{formatFecha(documento.fechaVencimiento)}</Celda>
                          <Celda>
                            {documento.vigente ? (
                              <Chip tono="ok">Vigente</Chip>
                            ) : (
                              <Chip tono="bad">Vencido</Chip>
                            )}
                          </Celda>
                          <Celda>{documento.subidoPor}</Celda>
                        </Fila>
                      ))
                    )}
                  </Tabla>
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
                      </div>
                      <h3 className="mt-2 font-heading text-base font-semibold text-ink">
                        {avance.titulo}
                      </h3>
                      <p className="medida-lectura mt-1 text-sm text-ink-soft">
                        {avance.descripcion}
                      </p>
                      <p className="mt-2 text-xs text-ink-soft">
                        Registrado por {avance.registradoPor}
                      </p>
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
                <Campo etiqueta="Nombre">{padrinazgo.padrino.nombre}</Campo>
                <Campo etiqueta="Correo">{padrinazgo.padrino.email}</Campo>
                <Campo etiqueta="Aporte mensual">
                  {formatQuetzales(aNumero(padrinazgo.aporteMensual))}
                </Campo>
                <Campo etiqueta="Desde">{formatFecha(padrinazgo.fechaInicio)}</Campo>
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
