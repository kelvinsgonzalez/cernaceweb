/**
 * ⚠️  DATOS DE DEMOSTRACIÓN — FICTICIOS
 *
 * Todo lo que inserta este archivo (personas, diagnósticos, ingresos,
 * donaciones) es inventado y sirve únicamente para poder presentar la
 * plataforma. Debe sustituirse por datos reales antes de producción, y
 * las contraseñas de demostración deben cambiarse.
 */

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATALOGO_PERMISOS, CATALOGO_ROLES } from "../src/lib/rbac";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Fecha de calendario: medianoche UTC, para que no se corra un día. */
const f = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
/** Marca de tiempo con hora. */
const t = (iso: string) => new Date(iso);

async function limpiar() {
  // El orden importa: primero lo que depende de otras tablas.
  await prisma.auditLog.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.volunteerApplication.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.media.deleteMany();
  await prisma.event.deleteMany();
  await prisma.post.deleteMany();
  await prisma.story.deleteMany();
  await prisma.donacion.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.padrinazgo.deleteMany();
  await prisma.padrino.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.seguimiento.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.evaluacionClinica.deleteMany();
  await prisma.fichaSocioeconomica.deleteMany();
  await prisma.expedienteClinico.deleteMany();
  await prisma.beneficiario.deleteMany();
  await prisma.programa.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

async function sembrarAcceso() {
  // Los permisos viven en la base; src/lib/rbac.ts es la fuente de verdad.
  for (const permiso of CATALOGO_PERMISOS) {
    await prisma.permission.create({
      data: {
        clave: permiso.clave,
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        modulo: permiso.modulo,
      },
    });
  }

  for (const rol of CATALOGO_ROLES) {
    await prisma.role.create({
      data: {
        clave: rol.clave,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: {
          create: rol.permisos.map((clave) => ({
            permission: { connect: { clave } },
          })),
        },
      },
    });
  }

  const passwordHash = await bcrypt.hash("cernace2026", 10);

  const cuentas = [
    {
      nombre: "Ana Lucía Set",
      email: "admin@cernace.org",
      cargo: "Administradora del sistema",
      rol: "ADMIN",
      ultimoAcceso: t("2026-08-07T14:20:00-06:00"),
    },
    {
      nombre: "Rodolfo Xitumul",
      email: "direccion@cernace.org",
      cargo: "Director general",
      rol: "DIRECCION",
      ultimoAcceso: t("2026-08-06T09:10:00-06:00"),
    },
    {
      nombre: "Marta Chalí",
      email: "trabajosocial@cernace.org",
      cargo: "Trabajadora social",
      rol: "TRABAJO_SOCIAL",
      ultimoAcceso: t("2026-08-07T11:45:00-06:00"),
    },
    {
      nombre: "Julio Mux",
      email: "terapeuta@cernace.org",
      cargo: "Terapeuta físico",
      rol: "TERAPEUTA",
      ultimoAcceso: t("2026-08-07T16:05:00-06:00"),
    },
    {
      nombre: "Elena Ríos",
      email: "padrino@cernace.org",
      cargo: null,
      rol: "PADRINO",
      ultimoAcceso: t("2026-08-05T20:30:00-06:00"),
    },
  ];

  const creados: Record<string, string> = {};
  for (const cuenta of cuentas) {
    const usuario = await prisma.user.create({
      data: {
        nombre: cuenta.nombre,
        email: cuenta.email,
        passwordHash,
        cargo: cuenta.cargo,
        ultimoAcceso: cuenta.ultimoAcceso,
        roles: { create: [{ role: { connect: { clave: cuenta.rol } } }] },
      },
    });
    creados[cuenta.rol] = usuario.id;
  }
  return creados;
}

async function sembrarProgramas() {
  const programas = [
    {
      nombre: "Estimulación temprana",
      descripcion:
        "Acompañamiento a niñas y niños de 0 a 4 años para favorecer el desarrollo motor, cognitivo y del lenguaje.",
      icono: "Baby",
    },
    {
      nombre: "Terapia física",
      descripcion:
        "Rehabilitación motora con planes individuales, hidroterapia y apoyo en el uso de órtesis.",
      icono: "Activity",
    },
    {
      nombre: "Terapia del lenguaje",
      descripcion:
        "Trabajo de comunicación, articulación y comprensión, con sistemas alternativos cuando hace falta.",
      icono: "MessagesSquare",
    },
    {
      nombre: "Educación especial",
      descripcion:
        "Aula adaptada con currículo flexible, orientada a la autonomía y a la inclusión escolar.",
      icono: "GraduationCap",
    },
    {
      nombre: "Terapia ocupacional",
      descripcion:
        "Actividades de la vida diaria, integración sensorial y adaptación del entorno del hogar.",
      icono: "Puzzle",
    },
    {
      nombre: "Apoyo psicológico familiar",
      descripcion:
        "Atención emocional para el beneficiario y su familia, con talleres para encargados.",
      icono: "HeartHandshake",
    },
  ];

  const ids: Record<string, string> = {};
  for (const programa of programas) {
    const creado = await prisma.programa.create({ data: programa });
    ids[programa.nombre] = creado.id;
  }
  return ids;
}

type DatosBeneficiario = {
  codigoExpediente: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: "MASCULINO" | "FEMENINO";
  cui: string;
  lugarNacimiento: string;
  idiomaHogar: string;
  tipoSangre: string;
  direccion: string;
  municipio: string;
  zonaResidencia: string;
  encargadoNombre: string;
  encargadoParentesco: string;
  encargadoTelefono: string;
  encargadoEmail: string | null;
  fechaIngreso: string;
  programa: string;
  estadoExpediente: "COMPLETO" | "EN_REVISION" | "INCOMPLETO";
  publicadoEnGaleria: boolean;
  resumenPublico: string | null;
};

async function sembrarBeneficiarios(programas: Record<string, string>) {
  const datos: DatosBeneficiario[] = [
    {
      codigoExpediente: "EXP-2024-0087",
      nombres: "Diego Alejandro",
      apellidos: "Sarat Coy",
      fechaNacimiento: "2018-03-14",
      sexo: "MASCULINO",
      cui: "3012845670401",
      lugarNacimiento: "Chimaltenango, Chimaltenango",
      idiomaHogar: "Español y kaqchikel",
      tipoSangre: "O+",
      direccion: "4a calle 5-32, colonia El Esfuerzo",
      municipio: "Chimaltenango",
      zonaResidencia: "Zona 2",
      encargadoNombre: "Rosa Coy Tzaj",
      encargadoParentesco: "Madre",
      encargadoTelefono: "5512 8834",
      encargadoEmail: "rosa.coy@example.com",
      fechaIngreso: "2024-02-05",
      programa: "Terapia física",
      estadoExpediente: "COMPLETO",
      publicadoEnGaleria: false,
      resumenPublico: null,
    },
    {
      codigoExpediente: "EXP-2024-0091",
      nombres: "Sofía Mariana",
      apellidos: "López Yax",
      fechaNacimiento: "2019-07-22",
      sexo: "FEMENINO",
      cui: "3104556780402",
      lugarNacimiento: "Patzicía, Chimaltenango",
      idiomaHogar: "Kaqchikel",
      tipoSangre: "A+",
      direccion: "Cantón San Antonio, lote 14",
      municipio: "Patzicía",
      zonaResidencia: "Área rural",
      encargadoNombre: "Manuela Yax Sic",
      encargadoParentesco: "Madre",
      encargadoTelefono: "4478 2210",
      encargadoEmail: null,
      fechaIngreso: "2024-03-18",
      programa: "Terapia del lenguaje",
      estadoExpediente: "COMPLETO",
      publicadoEnGaleria: true,
      resumenPublico:
        "Le encanta cantar y ya forma frases de tres palabras. Con apoyo constante podrá entrar a la escuela regular.",
    },
    {
      codigoExpediente: "EXP-2024-0104",
      nombres: "Kevin Estuardo",
      apellidos: "Miculax Pérez",
      fechaNacimiento: "2016-11-02",
      sexo: "MASCULINO",
      cui: "2896334450401",
      lugarNacimiento: "Chimaltenango, Chimaltenango",
      idiomaHogar: "Español",
      tipoSangre: "B+",
      direccion: "2a avenida 8-14, barrio San Sebastián",
      municipio: "Chimaltenango",
      zonaResidencia: "Zona 1",
      encargadoNombre: "Otilia Pérez Simón",
      encargadoParentesco: "Abuela",
      encargadoTelefono: "3321 7788",
      encargadoEmail: "otilia.perez@example.com",
      fechaIngreso: "2024-05-06",
      programa: "Educación especial",
      estadoExpediente: "EN_REVISION",
      publicadoEnGaleria: true,
      resumenPublico:
        "Aprende a leer con material adaptado y es el más puntual del aula. Busca un padrino que acompañe su año escolar.",
    },
    {
      codigoExpediente: "EXP-2025-0112",
      nombres: "Ana Belén",
      apellidos: "Tuy Cumez",
      fechaNacimiento: "2020-01-30",
      sexo: "FEMENINO",
      cui: "3245678900403",
      lugarNacimiento: "Comalapa, Chimaltenango",
      idiomaHogar: "Kaqchikel",
      tipoSangre: "O-",
      direccion: "Aldea Xenimaquín, casa 7",
      municipio: "San Juan Comalapa",
      zonaResidencia: "Área rural",
      encargadoNombre: "Julián Tuy Sotz",
      encargadoParentesco: "Padre",
      encargadoTelefono: "5590 4412",
      encargadoEmail: null,
      fechaIngreso: "2025-01-20",
      programa: "Estimulación temprana",
      estadoExpediente: "INCOMPLETO",
      publicadoEnGaleria: true,
      resumenPublico:
        "Empezó hace poco y ya sostiene la cabeza sin apoyo. Su familia recorre una hora para cada sesión.",
    },
    {
      codigoExpediente: "EXP-2025-0118",
      nombres: "José Carlos",
      apellidos: "Ixcayau Roquel",
      fechaNacimiento: "2015-06-09",
      sexo: "MASCULINO",
      cui: "2751889900404",
      lugarNacimiento: "Tecpán Guatemala, Chimaltenango",
      idiomaHogar: "Español y kaqchikel",
      tipoSangre: "A-",
      direccion: "5a calle 2-45, zona 3",
      municipio: "Tecpán Guatemala",
      zonaResidencia: "Zona 3",
      encargadoNombre: "Silvia Roquel Ajú",
      encargadoParentesco: "Madre",
      encargadoTelefono: "4102 6653",
      encargadoEmail: "silvia.roquel@example.com",
      fechaIngreso: "2025-02-11",
      programa: "Terapia ocupacional",
      estadoExpediente: "COMPLETO",
      publicadoEnGaleria: false,
      resumenPublico: null,
    },
    {
      codigoExpediente: "EXP-2025-0123",
      nombres: "María Fernanda",
      apellidos: "Chocoj Bal",
      fechaNacimiento: "2017-09-18",
      sexo: "FEMENINO",
      cui: "2988112340405",
      lugarNacimiento: "Zaragoza, Chimaltenango",
      idiomaHogar: "Español",
      tipoSangre: "AB+",
      direccion: "Colonia Los Encinos, casa 22",
      municipio: "Zaragoza",
      zonaResidencia: "Zona 1",
      encargadoNombre: "Delia Bal Morales",
      encargadoParentesco: "Madre",
      encargadoTelefono: "5544 9081",
      encargadoEmail: "delia.bal@example.com",
      fechaIngreso: "2025-03-03",
      programa: "Apoyo psicológico familiar",
      estadoExpediente: "COMPLETO",
      publicadoEnGaleria: false,
      resumenPublico: null,
    },
    {
      codigoExpediente: "EXP-2025-0130",
      nombres: "Pablo Andrés",
      apellidos: "Simón Guarcax",
      fechaNacimiento: "2014-12-05",
      sexo: "MASCULINO",
      cui: "2610445560406",
      lugarNacimiento: "Chimaltenango, Chimaltenango",
      idiomaHogar: "Español",
      tipoSangre: "O+",
      direccion: "7a avenida 1-19, zona 4",
      municipio: "Chimaltenango",
      zonaResidencia: "Zona 4",
      encargadoNombre: "Hugo Simón Cutzal",
      encargadoParentesco: "Padre",
      encargadoTelefono: "3398 1120",
      encargadoEmail: null,
      fechaIngreso: "2025-04-22",
      programa: "Terapia física",
      estadoExpediente: "INCOMPLETO",
      publicadoEnGaleria: false,
      resumenPublico: null,
    },
    {
      codigoExpediente: "EXP-2025-0136",
      nombres: "Lucía Isabel",
      apellidos: "Ajcalón Set",
      fechaNacimiento: "2021-04-27",
      sexo: "FEMENINO",
      cui: "3378990010407",
      lugarNacimiento: "Patzún, Chimaltenango",
      idiomaHogar: "Kaqchikel",
      tipoSangre: "B-",
      direccion: "Cantón Norte, calle principal",
      municipio: "Patzún",
      zonaResidencia: "Área rural",
      encargadoNombre: "Irma Set Quiñónez",
      encargadoParentesco: "Madre",
      encargadoTelefono: "4820 3376",
      encargadoEmail: null,
      fechaIngreso: "2025-06-09",
      programa: "Estimulación temprana",
      estadoExpediente: "EN_REVISION",
      publicadoEnGaleria: false,
      resumenPublico: null,
    },
  ];

  const ids: Record<string, string> = {};
  for (const b of datos) {
    const creado = await prisma.beneficiario.create({
      data: {
        codigoExpediente: b.codigoExpediente,
        nombres: b.nombres,
        apellidos: b.apellidos,
        fechaNacimiento: f(b.fechaNacimiento),
        sexo: b.sexo,
        cui: b.cui,
        lugarNacimiento: b.lugarNacimiento,
        idiomaHogar: b.idiomaHogar,
        tipoSangre: b.tipoSangre,
        direccion: b.direccion,
        municipio: b.municipio,
        departamento: "Chimaltenango",
        zonaResidencia: b.zonaResidencia,
        encargadoNombre: b.encargadoNombre,
        encargadoParentesco: b.encargadoParentesco,
        encargadoTelefono: b.encargadoTelefono,
        encargadoEmail: b.encargadoEmail,
        fechaIngreso: f(b.fechaIngreso),
        programaId: programas[b.programa],
        estado: "ACTIVO",
        estadoExpediente: b.estadoExpediente,
        publicadoEnGaleria: b.publicadoEnGaleria,
        resumenPublico: b.resumenPublico,
      },
    });
    ids[b.codigoExpediente] = creado.id;
  }
  return ids;
}

/** El expediente que se enseña en la defensa: completo y con todo el detalle. */
async function sembrarExpedientePrincipal(beneficiarioId: string) {
  await prisma.expedienteClinico.create({
    data: {
      beneficiarioId,
      diagnosticoPrincipal: "Parálisis cerebral infantil, forma espástica diparética",
      codigoCie10: "G80.1",
      fechaDiagnostico: f("2020-08-11"),
      tipoDiscapacidad: "Física / motora",
      gradoDependencia: "Moderado",
      medicoTratante: "Dra. Beatriz Alvarado, neuropediatría",
      alergias: "Penicilina",
      medicamentos: "Baclofeno 5 mg, dos veces al día",
      antecedentes:
        "Nacimiento prematuro a las 32 semanas, dos semanas en incubadora. Sin antecedentes familiares relevantes.",
      terapias: [
        "Terapia física",
        "Terapia ocupacional",
        "Hidroterapia",
        "Terapia del lenguaje",
      ],
    },
  });

  await prisma.evaluacionClinica.createMany({
    data: [
      {
        beneficiarioId,
        fecha: f("2024-02-19"),
        tipo: "Evaluación inicial de fisioterapia",
        profesional: "Julio Mux",
        resultado:
          "Marcha independiente en trayectos cortos con andador posterior. Espasticidad moderada en miembros inferiores.",
        documento: "eval-inicial-fisio.pdf",
      },
      {
        beneficiarioId,
        fecha: f("2024-08-14"),
        tipo: "Control semestral",
        profesional: "Julio Mux",
        resultado:
          "Mejora del equilibrio en bipedestación. Aumenta la tolerancia de marcha a 40 metros.",
        documento: "control-semestral-2024.pdf",
      },
      {
        beneficiarioId,
        fecha: f("2025-02-12"),
        tipo: "Evaluación de terapia ocupacional",
        profesional: "Karla Sactic",
        resultado:
          "Se viste con supervisión. Buena pinza fina. Se recomienda adaptar utensilios de comida.",
        documento: null,
      },
      {
        beneficiarioId,
        fecha: f("2026-03-04"),
        tipo: "Valoración neuropediátrica anual",
        profesional: "Dra. Beatriz Alvarado",
        resultado:
          "Cuadro estable. Se mantiene el baclofeno y se refuerza el trabajo de marcha con apoyo mínimo.",
        documento: "valoracion-neuro-2026.pdf",
      },
    ],
  });

  await prisma.fichaSocioeconomica.create({
    data: {
      beneficiarioId,
      integrantesHogar: 6,
      ingresoMensual: "1850.00",
      fuenteIngreso: "Venta informal de verduras y trabajo agrícola por jornal",
      tipoVivienda: "Alquilada",
      materialConstruccion: "Block sin repello, techo de lámina, piso de torta",
      escolaridadEncargado: "Sexto primaria",
      serviciosBasicos: ["Agua entubada", "Energía eléctrica", "Recolección de basura"],
      observaciones:
        "El hogar depende de un solo ingreso variable. El transporte a las terapias representa cerca del 15% del gasto mensual. Se recomienda beca completa y apoyo de transporte.",
      nivelVulnerabilidad: "ALTO",
      elegibleBeca: true,
      fechaEstudio: f("2024-02-27"),
      realizadoPor: "Marta Chalí",
    },
  });

  await prisma.documento.createMany({
    data: [
      {
        beneficiarioId,
        nombre: "Certificado de nacimiento",
        categoria: "Identificación",
        tipoMime: "application/pdf",
        tamanoBytes: 184320,
        url: "/documentos/demo/certificado-nacimiento.pdf",
        vigente: true,
        fechaVencimiento: null,
        subidoPor: "Marta Chalí",
      },
      {
        beneficiarioId,
        nombre: "DPI de la encargada",
        categoria: "Identificación",
        tipoMime: "image/jpeg",
        tamanoBytes: 512000,
        url: "/documentos/demo/dpi-encargada.jpg",
        vigente: true,
        fechaVencimiento: f("2029-05-30"),
        subidoPor: "Marta Chalí",
      },
      {
        beneficiarioId,
        nombre: "Diagnóstico neuropediátrico",
        categoria: "Clínico",
        tipoMime: "application/pdf",
        tamanoBytes: 302080,
        url: "/documentos/demo/diagnostico-neuro.pdf",
        vigente: true,
        fechaVencimiento: null,
        subidoPor: "Julio Mux",
      },
      {
        beneficiarioId,
        nombre: "Constancia de estudio socioeconómico",
        categoria: "Socioeconómico",
        tipoMime: "application/pdf",
        tamanoBytes: 143360,
        url: "/documentos/demo/constancia-socioeconomica.pdf",
        vigente: true,
        fechaVencimiento: f("2026-02-27"),
        subidoPor: "Marta Chalí",
      },
      {
        beneficiarioId,
        nombre: "Carta de compromiso de la familia",
        categoria: "Administrativo",
        tipoMime: "application/pdf",
        tamanoBytes: 98304,
        url: "/documentos/demo/carta-compromiso.pdf",
        vigente: true,
        fechaVencimiento: null,
        subidoPor: "Ana Lucía Set",
      },
      {
        beneficiarioId,
        nombre: "Fotografía para carné 2025",
        categoria: "Administrativo",
        tipoMime: "image/png",
        tamanoBytes: 245760,
        url: "/documentos/demo/foto-carne.png",
        vigente: false,
        fechaVencimiento: f("2025-12-31"),
        subidoPor: "Ana Lucía Set",
      },
    ],
  });

  // Tres avances: dos visibles para el padrino y uno interno, para poder
  // demostrar el filtrado del objetivo 3 en la defensa.
  await prisma.seguimiento.createMany({
    data: [
      {
        beneficiarioId,
        fecha: f("2026-04-16"),
        area: "Terapia física",
        titulo: "Camina 40 metros con apoyo mínimo",
        descripcion:
          "Diego completó el circuito del patio con una sola mano de apoyo. Es la primera vez que lo logra sin el andador.",
        visibleParaPadrino: true,
        registradoPor: "Julio Mux",
      },
      {
        beneficiarioId,
        fecha: f("2026-06-11"),
        area: "Terapia del lenguaje",
        titulo: "Amplía su vocabulario funcional",
        descripcion:
          "Usa frases de cuatro y cinco palabras para pedir lo que necesita. Participa en la ronda de saludos del aula.",
        visibleParaPadrino: true,
        registradoPor: "Karla Sactic",
      },
      {
        beneficiarioId,
        fecha: f("2026-07-02"),
        area: "Trabajo social",
        titulo: "Nota interna: seguimiento a la situación del hogar",
        descripcion:
          "La madre reporta atraso de dos meses en el alquiler. Se gestiona apoyo con la bolsa de emergencia y se coordina visita domiciliaria. No compartir con el padrino.",
        visibleParaPadrino: false,
        registradoPor: "Marta Chalí",
      },
    ],
  });

  await prisma.cita.create({
    data: {
      beneficiarioId,
      fecha: t("2026-09-15T09:00:00-06:00"),
      tipo: "Terapia física — sesión semanal",
      profesional: "Julio Mux",
    },
  });
}

/** Los otros expedientes, con distinto grado de completitud. */
async function sembrarExpedientesSecundarios(ids: Record<string, string>) {
  await prisma.expedienteClinico.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        diagnosticoPrincipal: "Trastorno del lenguaje expresivo",
        codigoCie10: "F80.1",
        fechaDiagnostico: f("2023-11-08"),
        tipoDiscapacidad: "Del habla y la comunicación",
        gradoDependencia: "Leve",
        medicoTratante: "Dra. Beatriz Alvarado",
        alergias: null,
        medicamentos: null,
        antecedentes: "Otitis recurrentes en los dos primeros años.",
        terapias: ["Terapia del lenguaje"],
      },
      {
        beneficiarioId: ids["EXP-2024-0104"],
        diagnosticoPrincipal: "Discapacidad intelectual leve",
        codigoCie10: "F70",
        fechaDiagnostico: f("2022-04-19"),
        tipoDiscapacidad: "Intelectual",
        gradoDependencia: "Leve",
        medicoTratante: null,
        alergias: null,
        medicamentos: null,
        antecedentes: null,
        terapias: ["Educación especial", "Terapia ocupacional"],
      },
      {
        beneficiarioId: ids["EXP-2025-0118"],
        diagnosticoPrincipal: "Trastorno del espectro autista",
        codigoCie10: "F84.0",
        fechaDiagnostico: f("2019-10-01"),
        tipoDiscapacidad: "Del neurodesarrollo",
        gradoDependencia: "Moderado",
        medicoTratante: "Dr. Enrique Salazar",
        alergias: "Lactosa",
        medicamentos: null,
        antecedentes: "Hiperreactividad sensorial a los ruidos fuertes.",
        terapias: ["Terapia ocupacional", "Integración sensorial"],
      },
      {
        beneficiarioId: ids["EXP-2025-0123"],
        diagnosticoPrincipal: "Trastorno de ansiedad por separación",
        codigoCie10: "F93.0",
        fechaDiagnostico: f("2024-09-05"),
        tipoDiscapacidad: "Psicosocial",
        gradoDependencia: "Leve",
        medicoTratante: null,
        alergias: null,
        medicamentos: null,
        antecedentes: null,
        terapias: ["Apoyo psicológico"],
      },
    ],
  });

  await prisma.fichaSocioeconomica.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        integrantesHogar: 5,
        ingresoMensual: "2400.00",
        fuenteIngreso: "Trabajo agrícola",
        tipoVivienda: "Propia",
        materialConstruccion: "Block, techo de lámina",
        escolaridadEncargado: "Tercero básico",
        serviciosBasicos: ["Agua entubada", "Energía eléctrica"],
        observaciones: "Hogar estable con red familiar de apoyo.",
        nivelVulnerabilidad: "MEDIO",
        elegibleBeca: true,
        fechaEstudio: f("2024-04-02"),
        realizadoPor: "Marta Chalí",
      },
      {
        beneficiarioId: ids["EXP-2024-0104"],
        integrantesHogar: 3,
        ingresoMensual: "1500.00",
        fuenteIngreso: "Pensión de la abuela y ventas ocasionales",
        tipoVivienda: "Prestada",
        materialConstruccion: "Adobe, techo de lámina",
        escolaridadEncargado: "Segundo primaria",
        serviciosBasicos: ["Energía eléctrica"],
        observaciones: "La abuela es la única responsable. Se recomienda beca completa.",
        nivelVulnerabilidad: "ALTO",
        elegibleBeca: true,
        fechaEstudio: f("2024-06-14"),
        realizadoPor: "Marta Chalí",
      },
      {
        beneficiarioId: ids["EXP-2025-0118"],
        integrantesHogar: 4,
        ingresoMensual: "4200.00",
        fuenteIngreso: "Comercio formal",
        tipoVivienda: "Propia",
        materialConstruccion: "Block con repello, piso cerámico",
        escolaridadEncargado: "Diversificado",
        serviciosBasicos: [
          "Agua potable",
          "Energía eléctrica",
          "Drenajes",
          "Internet",
        ],
        observaciones: "La familia cubre parte del costo de las terapias.",
        nivelVulnerabilidad: "BAJO",
        elegibleBeca: false,
        fechaEstudio: f("2025-02-25"),
        realizadoPor: "Marta Chalí",
      },
      {
        beneficiarioId: ids["EXP-2025-0123"],
        integrantesHogar: 4,
        ingresoMensual: "3100.00",
        fuenteIngreso: "Empleo en maquila",
        tipoVivienda: "Alquilada",
        materialConstruccion: "Block con repello",
        escolaridadEncargado: "Tercero básico",
        serviciosBasicos: ["Agua potable", "Energía eléctrica", "Drenajes"],
        observaciones: null,
        nivelVulnerabilidad: "MEDIO",
        elegibleBeca: false,
        fechaEstudio: f("2025-03-19"),
        realizadoPor: "Marta Chalí",
      },
    ],
  });

  await prisma.seguimiento.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        fecha: f("2026-05-20"),
        area: "Terapia del lenguaje",
        titulo: "Pronuncia correctamente los fonemas /r/ y /s/",
        descripcion:
          "Sofía completó la serie de ejercicios sin apoyo visual. Se avanza al siguiente nivel del plan.",
        visibleParaPadrino: true,
        registradoPor: "Karla Sactic",
      },
      {
        beneficiarioId: ids["EXP-2024-0104"],
        fecha: f("2026-06-30"),
        area: "Educación especial",
        titulo: "Lee palabras de dos sílabas",
        descripcion:
          "Kevin identifica y lee en voz alta 20 palabras del material adaptado.",
        visibleParaPadrino: true,
        registradoPor: "Ana Lucía Set",
      },
      {
        beneficiarioId: ids["EXP-2025-0118"],
        fecha: f("2026-07-14"),
        area: "Terapia ocupacional",
        titulo: "Tolera la rutina de grupo completa",
        descripcion:
          "José Carlos permanece los 45 minutos de la sesión grupal sin necesidad de pausa sensorial.",
        visibleParaPadrino: true,
        registradoPor: "Karla Sactic",
      },
    ],
  });

  await prisma.evaluacionClinica.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        fecha: f("2026-02-10"),
        tipo: "Control de lenguaje",
        profesional: "Karla Sactic",
        resultado: "Vocabulario expresivo dentro del rango esperado para su edad.",
        documento: null,
      },
      {
        beneficiarioId: ids["EXP-2025-0118"],
        fecha: f("2026-04-08"),
        tipo: "Perfil sensorial",
        profesional: "Karla Sactic",
        resultado: "Se reduce la hiperreactividad auditiva con el uso de audífonos.",
        documento: null,
      },
    ],
  });

  await prisma.documento.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        nombre: "Certificado de nacimiento",
        categoria: "Identificación",
        tipoMime: "application/pdf",
        tamanoBytes: 176128,
        url: "/documentos/demo/certificado-0091.pdf",
        vigente: true,
        fechaVencimiento: null,
        subidoPor: "Marta Chalí",
      },
      {
        beneficiarioId: ids["EXP-2024-0104"],
        nombre: "DPI de la abuela",
        categoria: "Identificación",
        tipoMime: "image/jpeg",
        tamanoBytes: 460800,
        url: "/documentos/demo/dpi-0104.jpg",
        vigente: true,
        fechaVencimiento: f("2027-08-14"),
        subidoPor: "Marta Chalí",
      },
    ],
  });

  await prisma.cita.createMany({
    data: [
      {
        beneficiarioId: ids["EXP-2024-0091"],
        fecha: t("2026-09-10T10:30:00-06:00"),
        tipo: "Terapia del lenguaje",
        profesional: "Karla Sactic",
      },
      {
        beneficiarioId: ids["EXP-2024-0104"],
        fecha: t("2026-09-12T08:00:00-06:00"),
        tipo: "Refuerzo escolar",
        profesional: "Ana Lucía Set",
      },
    ],
  });
}

async function sembrarPadrinos(
  ids: Record<string, string>,
  usuarios: Record<string, string>,
) {
  const padrinos = [
    {
      nombre: "Elena Ríos",
      email: "padrino@cernace.org",
      telefono: "5566 1120",
      ocupacion: "Contadora",
      userId: usuarios.PADRINO,
      apadrina: ["EXP-2024-0087", "EXP-2024-0091"],
      aporte: "350.00",
    },
    {
      nombre: "Carlos Menéndez",
      email: "carlos.menendez@example.com",
      telefono: "4412 7788",
      ocupacion: "Ingeniero civil",
      userId: null,
      apadrina: ["EXP-2025-0118"],
      aporte: "500.00",
    },
    {
      nombre: "Fundación Semilla",
      email: "contacto@semilla.example.org",
      telefono: "2233 4455",
      ocupacion: "Organización donante",
      userId: null,
      apadrina: ["EXP-2025-0123"],
      aporte: "800.00",
    },
    {
      nombre: "Patricia Guzmán",
      email: "patricia.guzman@example.com",
      telefono: "3120 6644",
      ocupacion: "Docente",
      userId: null,
      apadrina: ["EXP-2025-0136"],
      aporte: "250.00",
    },
    {
      nombre: "Luis Batz",
      email: "luis.batz@example.com",
      telefono: "5871 0092",
      ocupacion: "Comerciante",
      userId: null,
      apadrina: [],
      aporte: "300.00",
    },
  ];

  const creados: Record<string, string> = {};
  for (const p of padrinos) {
    const padrino = await prisma.padrino.create({
      data: {
        nombre: p.nombre,
        email: p.email,
        telefono: p.telefono,
        ocupacion: p.ocupacion,
        userId: p.userId,
        padrinazgos: {
          create: p.apadrina.map((codigo) => ({
            beneficiarioId: ids[codigo],
            aporteMensual: p.aporte,
            modalidad: "MENSUAL" as const,
            activo: true,
            fechaInicio: f("2025-01-15"),
          })),
        },
      },
    });
    creados[p.email] = padrino.id;
  }
  return creados;
}

async function sembrarDonacionesYCampanas(padrinos: Record<string, string>) {
  const navidad = await prisma.campaign.create({
    data: {
      titulo: "Navidad con terapias 2026",
      slug: "navidad-con-terapias-2026",
      descripcion:
        "Cubrir tres meses de terapia para veinte beneficiarios que hoy no tienen padrino asignado.",
      meta: "75000.00",
      recaudado: "28400.00",
      fechaInicio: f("2026-10-01"),
      fechaFin: f("2026-12-24"),
      activa: true,
    },
  });

  const transporte = await prisma.campaign.create({
    data: {
      titulo: "Transporte seguro para el área rural",
      slug: "transporte-seguro-area-rural",
      descripcion:
        "Un microbús adaptado para recoger a las familias de Comalapa, Patzún y Patzicía.",
      meta: "180000.00",
      recaudado: "42750.00",
      fechaInicio: f("2026-03-01"),
      fechaFin: null,
      activa: true,
    },
  });

  await prisma.donacion.createMany({
    data: [
      {
        donanteNombre: "Elena Ríos",
        donanteEmail: "padrino@cernace.org",
        padrinoId: padrinos["padrino@cernace.org"],
        campaignId: null,
        monto: "700.00",
        metodo: "TARJETA",
        estado: "COMPLETADA",
        referenciaPasarela: "CER-SIM-7HK2PA",
        recurrente: true,
        mensaje: "Aporte mensual de agosto.",
      },
      {
        donanteNombre: "Carlos Menéndez",
        donanteEmail: "carlos.menendez@example.com",
        padrinoId: padrinos["carlos.menendez@example.com"],
        campaignId: navidad.id,
        monto: "1500.00",
        metodo: "TRANSFERENCIA",
        estado: "COMPLETADA",
        referenciaPasarela: "CER-SIM-3QM9XD",
        recurrente: false,
        mensaje: null,
      },
      {
        donanteNombre: "Anónimo",
        donanteEmail: "anonimo@example.com",
        padrinoId: null,
        campaignId: transporte.id,
        monto: "250.00",
        metodo: "DEPOSITO",
        estado: "PENDIENTE",
        referenciaPasarela: "CER-SIM-5TB4LR",
        recurrente: false,
        mensaje: "Depósito pendiente de confirmar.",
      },
      {
        donanteNombre: "Sandra Pichiyá",
        donanteEmail: "sandra.pichiya@example.com",
        padrinoId: null,
        campaignId: null,
        monto: "400.00",
        metodo: "TARJETA",
        estado: "FALLIDA",
        referenciaPasarela: "CER-SIM-9WD6ZC",
        recurrente: false,
        mensaje: null,
      },
    ],
  });
}

async function sembrarContenido() {
  await prisma.story.createMany({
    data: [
      {
        titulo: "Diego dio sus primeros cuarenta metros",
        slug: "diego-primeros-cuarenta-metros",
        resumen:
          "Después de dos años de terapia física, Diego recorrió el patio con una sola mano de apoyo.",
        contenido:
          "Cuando Diego llegó a CERNACE en febrero de 2024 necesitaba andador para cualquier desplazamiento. Su plan combinó terapia física, hidroterapia y trabajo en casa con su mamá. En abril de 2026 cruzó el patio con una sola mano de apoyo: cuarenta metros que en la ficha son un número y en su casa fueron una fiesta.",
        protagonista: "Diego",
        programa: "Terapia física",
        estado: "PUBLICADO",
        publicadaEn: t("2026-05-02T10:00:00-06:00"),
      },
      {
        titulo: "Sofía ya canta en la ronda del aula",
        slug: "sofia-canta-en-la-ronda",
        resumen:
          "El trabajo de lenguaje le devolvió la confianza para participar con sus compañeros.",
        contenido:
          "Sofía llegó sin usar palabras completas. Hoy forma frases de tres y cuatro palabras, y es la primera en levantar la mano en la ronda de saludos. Su madre recorre cuarenta minutos desde Patzicía cada semana.",
        protagonista: "Sofía",
        programa: "Terapia del lenguaje",
        estado: "PUBLICADO",
        publicadaEn: t("2026-06-18T10:00:00-06:00"),
      },
      {
        titulo: "La abuela de Kevin y el cuaderno de tareas",
        slug: "la-abuela-de-kevin",
        resumen:
          "Doña Otilia no terminó la primaria, pero acompaña cada tarea de su nieto.",
        contenido:
          "Doña Otilia cría sola a Kevin. No terminó la primaria, así que el aula de educación especial le preparó un cuaderno con instrucciones ilustradas. Kevin ya lee veinte palabras y no ha faltado ni un día.",
        protagonista: "Kevin",
        programa: "Educación especial",
        estado: "PUBLICADO",
        publicadaEn: t("2026-07-09T10:00:00-06:00"),
      },
    ],
  });

  await prisma.post.createMany({
    data: [
      {
        titulo: "Cómo preparar la casa para la terapia diaria",
        slug: "preparar-la-casa-para-la-terapia",
        resumen:
          "Cinco adaptaciones baratas que multiplican el efecto de la sesión semanal.",
        contenido:
          "El avance no ocurre solo en la sala de terapia. Un pasamanos improvisado, una silla a la altura correcta y quince minutos diarios de ejercicios sostienen lo que se trabaja en CERNACE.",
        autor: "Julio Mux",
        categoria: "Guías para familias",
        estado: "PUBLICADO",
        publicadoEn: t("2026-04-11T09:00:00-06:00"),
      },
      {
        titulo: "Qué cubre realmente un apadrinamiento",
        slug: "que-cubre-un-apadrinamiento",
        resumen:
          "Desglose honesto de a dónde va cada quetzal del aporte mensual.",
        contenido:
          "De un aporte de Q350 al mes, Q210 cubren sesiones de terapia, Q70 material adaptado, Q45 transporte de la familia y Q25 gastos administrativos. Publicamos el desglose cada trimestre.",
        autor: "Ana Lucía Set",
        categoria: "Transparencia",
        estado: "PUBLICADO",
        publicadoEn: t("2026-06-25T09:00:00-06:00"),
      },
    ],
  });

  await prisma.event.createMany({
    data: [
      {
        titulo: "Jornada de evaluación gratuita",
        slug: "jornada-evaluacion-gratuita",
        descripcion:
          "Valoración inicial sin costo para familias de Chimaltenango. Cupo limitado, inscripción previa.",
        lugar: "Sede CERNACE, 4a calle 6-21 zona 2, Chimaltenango",
        inicia: t("2026-09-05T08:00:00-06:00"),
        termina: t("2026-09-05T16:00:00-06:00"),
        cupo: 40,
        estado: "PUBLICADO",
      },
      {
        titulo: "Taller para encargados: manejo de crisis sensoriales",
        slug: "taller-crisis-sensoriales",
        descripcion:
          "Sesión práctica para madres, padres y cuidadores. Incluye refacción y material impreso.",
        lugar: "Salón parroquial, Tecpán Guatemala",
        inicia: t("2026-10-18T14:00:00-06:00"),
        termina: t("2026-10-18T17:00:00-06:00"),
        cupo: 25,
        estado: "PUBLICADO",
      },
    ],
  });

  await prisma.media.createMany({
    data: [
      {
        nombre: "Patio de terapias",
        url: "/medios/demo/patio.jpg",
        tipoMime: "image/jpeg",
        tamanoBytes: 890000,
        alt: "Niños trabajando con andadores en el patio del centro",
        subidoPor: "Ana Lucía Set",
      },
      {
        nombre: "Aula de educación especial",
        url: "/medios/demo/aula.jpg",
        tipoMime: "image/jpeg",
        tamanoBytes: 760000,
        alt: "Aula con mesas bajas y material didáctico adaptado",
        subidoPor: "Ana Lucía Set",
      },
    ],
  });
}

async function sembrarFormularios() {
  await prisma.supportRequest.createMany({
    data: [
      {
        nombreNino: "Mateo Ixchop Cuc",
        fechaNacimiento: f("2019-11-23"),
        sexo: "MASCULINO",
        municipio: "San Martín Jilotepeque",
        departamento: "Chimaltenango",
        encargadoNombre: "Blanca Cuc Sotz",
        encargadoParentesco: "Madre",
        encargadoTelefono: "5533 9012",
        encargadoEmail: "blanca.cuc@example.com",
        diagnostico: "Retraso del desarrollo psicomotor",
        programaSolicitado: "Estimulación temprana",
        comentarios: "Nos recomendó el centro de salud del municipio.",
        estado: "NUEVA",
      },
      {
        nombreNino: "Valeria Sicán Ajanel",
        fechaNacimiento: f("2016-02-08"),
        sexo: "FEMENINO",
        municipio: "Patzún",
        departamento: "Chimaltenango",
        encargadoNombre: "Edgar Sicán López",
        encargadoParentesco: "Padre",
        encargadoTelefono: "4067 2231",
        encargadoEmail: null,
        diagnostico: "Hipoacusia bilateral",
        programaSolicitado: "Terapia del lenguaje",
        comentarios: null,
        estado: "EN_REVISION",
      },
    ],
  });

  await prisma.volunteerApplication.createMany({
    data: [
      {
        nombre: "Andrea Colaj",
        email: "andrea.colaj@example.com",
        telefono: "5710 8823",
        tipo: "PADRINO",
        ocupacion: "Médica general",
        disponibilidad: null,
        aporteMensual: "400.00",
        motivacion: "Quiero apoyar a un niño del programa de terapia física.",
        estado: "NUEVA",
      },
      {
        nombre: "Bryan Tzunún",
        email: "bryan.tzunun@example.com",
        telefono: "3345 1198",
        tipo: "VOLUNTARIO",
        ocupacion: "Estudiante de fisioterapia",
        disponibilidad: "Sábados por la mañana",
        aporteMensual: null,
        motivacion: "Busco horas de práctica supervisada y quiero aportar al centro.",
        estado: "EN_REVISION",
      },
    ],
  });

  await prisma.contactMessage.createMany({
    data: [
      {
        nombre: "Wendy Salazar",
        email: "wendy.salazar@example.com",
        telefono: "5588 1177",
        asunto: "Donación de material didáctico",
        mensaje:
          "Mi empresa quiere donar material didáctico adaptado. ¿Con quién coordino la entrega?",
        estado: "NUEVA",
      },
      {
        nombre: "Colegio Santa Teresa",
        email: "direccion@santateresa.example.edu",
        telefono: "7839 4420",
        asunto: "Visita de estudiantes",
        mensaje:
          "Quisiéramos organizar una visita de nuestros estudiantes de bachillerato al centro.",
        estado: "EN_REVISION",
      },
    ],
  });
}

async function sembrarConfiguracion() {
  await prisma.setting.createMany({
    data: [
      {
        clave: "organizacion.nombre",
        valor: "CERNACE",
        descripcion: "Nombre corto de la organización.",
        grupo: "general",
      },
      {
        clave: "organizacion.nombreCompleto",
        valor:
          "Centro de Educación y Rehabilitación para Niños y Adolescentes con Capacidades Especiales",
        descripcion: "Nombre completo para documentos oficiales.",
        grupo: "general",
      },
      {
        clave: "contacto.telefono",
        valor: "7839 2214",
        descripcion: "Teléfono que aparece en la barra superior del sitio.",
        grupo: "contacto",
      },
      {
        clave: "contacto.email",
        valor: "info@cernace.org",
        descripcion: "Correo público de contacto.",
        grupo: "contacto",
      },
      {
        clave: "contacto.direccion",
        valor: "4a calle 6-21, zona 2, Chimaltenango, Guatemala",
        descripcion: "Dirección de la sede.",
        grupo: "contacto",
      },
      {
        clave: "donaciones.aporteSugerido",
        valor: "350",
        descripcion: "Aporte mensual sugerido para un apadrinamiento, en quetzales.",
        grupo: "donaciones",
      },
      {
        clave: "pasarela.modo",
        valor: "PRUEBA",
        descripcion: "Modo de la pasarela de pago. En producción debe ser PRODUCCION.",
        grupo: "donaciones",
      },
    ],
  });
}

async function sembrarAuditoria(codigoPrincipal: string, idPrincipal: string) {
  const entradas = [
    {
      actor: "admin@cernace.org",
      accion: "CREAR",
      entidad: "Beneficiario",
      detalle: `Alta del expediente ${codigoPrincipal}`,
      createdAt: t("2024-02-05T09:12:00-06:00"),
    },
    {
      actor: "trabajosocial@cernace.org",
      accion: "CREAR",
      entidad: "FichaSocioeconomica",
      detalle: "Estudio socioeconómico registrado. Nivel de vulnerabilidad: ALTO",
      createdAt: t("2024-02-27T15:40:00-06:00"),
    },
    {
      actor: "terapeuta@cernace.org",
      accion: "CREAR",
      entidad: "EvaluacionClinica",
      detalle: "Evaluación inicial de fisioterapia",
      createdAt: t("2024-02-19T11:05:00-06:00"),
    },
    {
      actor: "terapeuta@cernace.org",
      accion: "VER_EXPEDIENTE",
      entidad: "Beneficiario",
      detalle: `Consulta del expediente ${codigoPrincipal}`,
      createdAt: t("2026-04-16T08:55:00-06:00"),
    },
    {
      actor: "terapeuta@cernace.org",
      accion: "CREAR",
      entidad: "Seguimiento",
      detalle: "Avance «Camina 40 metros con apoyo mínimo» (visible para el padrino)",
      createdAt: t("2026-04-16T09:30:00-06:00"),
    },
    {
      actor: "trabajosocial@cernace.org",
      accion: "CREAR",
      entidad: "Seguimiento",
      detalle: "Nota interna de trabajo social (no visible para el padrino)",
      createdAt: t("2026-07-02T14:15:00-06:00"),
    },
    {
      actor: "direccion@cernace.org",
      accion: "VER_EXPEDIENTE",
      entidad: "Beneficiario",
      detalle: `Consulta del expediente ${codigoPrincipal}`,
      createdAt: t("2026-07-20T10:02:00-06:00"),
    },
    {
      actor: "padrino@cernace.org",
      accion: "VER_PORTAL",
      entidad: "Padrinazgo",
      detalle: "Consulta del progreso del beneficiado desde el portal",
      createdAt: t("2026-08-05T20:31:00-06:00"),
    },
    {
      actor: "admin@cernace.org",
      accion: "ACTUALIZAR",
      entidad: "Beneficiario",
      detalle: "Se marcó el expediente como COMPLETO",
      createdAt: t("2026-08-06T08:20:00-06:00"),
    },
  ];

  for (const entrada of entradas) {
    await prisma.auditLog.create({
      data: {
        actor: entrada.actor,
        accion: entrada.accion,
        entidad: entrada.entidad,
        entidadId: idPrincipal,
        detalle: entrada.detalle,
        ip: "192.168.1.24",
        createdAt: entrada.createdAt,
      },
    });
  }
}

async function main() {
  console.log("⚠️  Sembrando DATOS FICTICIOS de demostración.");
  console.log("   Sustitúyelos y cambia las contraseñas antes de producción.\n");

  await limpiar();
  const usuarios = await sembrarAcceso();
  console.log("· Roles, permisos y 5 cuentas de demostración");

  const programas = await sembrarProgramas();
  console.log("· 6 programas");

  const beneficiarios = await sembrarBeneficiarios(programas);
  console.log("· 8 beneficiarios");

  await sembrarExpedientePrincipal(beneficiarios["EXP-2024-0087"]);
  await sembrarExpedientesSecundarios(beneficiarios);
  console.log("· Expedientes clínicos, fichas, documentos, avances y citas");

  const padrinos = await sembrarPadrinos(beneficiarios, usuarios);
  console.log("· 5 padrinos (3 beneficiarios quedan sin padrino)");

  await sembrarDonacionesYCampanas(padrinos);
  console.log("· 2 campañas y 4 donaciones");

  await sembrarContenido();
  console.log("· 3 historias, 2 entradas de blog, 2 eventos, 2 medios");

  await sembrarFormularios();
  console.log("· 2 solicitudes, 2 postulaciones, 2 mensajes");

  await sembrarConfiguracion();
  await sembrarAuditoria("EXP-2024-0087", beneficiarios["EXP-2024-0087"]);
  console.log("· Configuración y bitácora\n");

  console.log("Listo. Cuentas de demostración (contraseña: cernace2026):");
  console.log("  admin@cernace.org         ADMIN");
  console.log("  direccion@cernace.org     DIRECCION");
  console.log("  trabajosocial@cernace.org TRABAJO_SOCIAL");
  console.log("  terapeuta@cernace.org     TERAPEUTA");
  console.log("  padrino@cernace.org       PADRINO");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
