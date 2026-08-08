-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "EstadoBeneficiario" AS ENUM ('ACTIVO', 'INACTIVO', 'EGRESADO');

-- CreateEnum
CREATE TYPE "EstadoExpediente" AS ENUM ('COMPLETO', 'EN_REVISION', 'INCOMPLETO');

-- CreateEnum
CREATE TYPE "NivelVulnerabilidad" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "EstadoDonacion" AS ENUM ('PENDIENTE', 'COMPLETADA', 'FALLIDA', 'REEMBOLSADA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('NUEVA', 'EN_REVISION', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "ModalidadPadrinazgo" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'ANUAL', 'UNICO');

-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('BORRADOR', 'PUBLICADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cargo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "icono" TEXT NOT NULL DEFAULT 'HeartHandshake',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" TEXT NOT NULL,
    "codigoExpediente" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "cui" TEXT,
    "lugarNacimiento" TEXT,
    "idiomaHogar" TEXT,
    "tipoSangre" TEXT,
    "direccion" TEXT,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "zonaResidencia" TEXT,
    "encargadoNombre" TEXT NOT NULL,
    "encargadoParentesco" TEXT NOT NULL,
    "encargadoTelefono" TEXT NOT NULL,
    "encargadoEmail" TEXT,
    "fechaIngreso" DATE NOT NULL,
    "programaId" TEXT NOT NULL,
    "estado" "EstadoBeneficiario" NOT NULL DEFAULT 'ACTIVO',
    "estadoExpediente" "EstadoExpediente" NOT NULL DEFAULT 'EN_REVISION',
    "publicadoEnGaleria" BOOLEAN NOT NULL DEFAULT false,
    "resumenPublico" TEXT,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes_clinicos" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "diagnosticoPrincipal" TEXT NOT NULL,
    "codigoCie10" TEXT,
    "fechaDiagnostico" DATE,
    "tipoDiscapacidad" TEXT NOT NULL,
    "gradoDependencia" TEXT NOT NULL,
    "medicoTratante" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "antecedentes" TEXT,
    "terapias" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expedientes_clinicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_clinicas" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "profesional" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "documento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_socioeconomicas" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "integrantesHogar" INTEGER NOT NULL,
    "ingresoMensual" DECIMAL(10,2) NOT NULL,
    "fuenteIngreso" TEXT NOT NULL,
    "tipoVivienda" TEXT NOT NULL,
    "materialConstruccion" TEXT NOT NULL,
    "escolaridadEncargado" TEXT NOT NULL,
    "serviciosBasicos" TEXT[],
    "observaciones" TEXT,
    "nivelVulnerabilidad" "NivelVulnerabilidad" NOT NULL,
    "elegibleBeca" BOOLEAN NOT NULL DEFAULT false,
    "fechaEstudio" DATE NOT NULL,
    "realizadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_socioeconomicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "fechaVencimiento" DATE,
    "subidoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "area" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "visibleParaPadrino" BOOLEAN NOT NULL DEFAULT false,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "profesional" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "padrinos" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "ocupacion" TEXT,
    "nit" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "padrinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "padrinazgos" (
    "id" TEXT NOT NULL,
    "padrinoId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "aporteMensual" DECIMAL(10,2) NOT NULL,
    "modalidad" "ModalidadPadrinazgo" NOT NULL DEFAULT 'MENSUAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "padrinazgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaciones" (
    "id" TEXT NOT NULL,
    "donanteNombre" TEXT NOT NULL,
    "donanteEmail" TEXT NOT NULL,
    "padrinoId" TEXT,
    "campaignId" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'GTQ',
    "metodo" TEXT NOT NULL,
    "estado" "EstadoDonacion" NOT NULL DEFAULT 'PENDIENTE',
    "referenciaPasarela" TEXT NOT NULL,
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "mensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "meta" DECIMAL(10,2) NOT NULL,
    "recaudado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "imagenUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "protagonista" TEXT NOT NULL,
    "programa" TEXT,
    "imagenUrl" TEXT,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'PUBLICADO',
    "publicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas_blog" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'PUBLICADO',
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entradas_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "inicia" TIMESTAMP(3) NOT NULL,
    "termina" TIMESTAMP(3),
    "cupo" INTEGER,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'PUBLICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "alt" TEXT,
    "subidoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_inscripcion" (
    "id" TEXT NOT NULL,
    "nombreNino" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "encargadoNombre" TEXT NOT NULL,
    "encargadoParentesco" TEXT NOT NULL,
    "encargadoTelefono" TEXT NOT NULL,
    "encargadoEmail" TEXT,
    "diagnostico" TEXT,
    "programaSolicitado" TEXT,
    "comentarios" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'NUEVA',
    "notaInterna" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postulaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ocupacion" TEXT,
    "disponibilidad" TEXT,
    "aporteMensual" DECIMAL(10,2),
    "motivacion" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'NUEVA',
    "notaInterna" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'NUEVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensajes_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "grupo" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_clave_key" ON "roles"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_clave_key" ON "permisos"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_codigoExpediente_key" ON "beneficiarios"("codigoExpediente");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_cui_key" ON "beneficiarios"("cui");

-- CreateIndex
CREATE INDEX "beneficiarios_programaId_idx" ON "beneficiarios"("programaId");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_clinicos_beneficiarioId_key" ON "expedientes_clinicos"("beneficiarioId");

-- CreateIndex
CREATE INDEX "evaluaciones_clinicas_beneficiarioId_idx" ON "evaluaciones_clinicas"("beneficiarioId");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_socioeconomicas_beneficiarioId_key" ON "fichas_socioeconomicas"("beneficiarioId");

-- CreateIndex
CREATE INDEX "documentos_beneficiarioId_idx" ON "documentos"("beneficiarioId");

-- CreateIndex
CREATE INDEX "seguimientos_beneficiarioId_idx" ON "seguimientos"("beneficiarioId");

-- CreateIndex
CREATE INDEX "citas_beneficiarioId_idx" ON "citas"("beneficiarioId");

-- CreateIndex
CREATE UNIQUE INDEX "padrinos_userId_key" ON "padrinos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "padrinos_email_key" ON "padrinos"("email");

-- CreateIndex
CREATE INDEX "padrinazgos_beneficiarioId_idx" ON "padrinazgos"("beneficiarioId");

-- CreateIndex
CREATE UNIQUE INDEX "padrinazgos_padrinoId_beneficiarioId_key" ON "padrinazgos"("padrinoId", "beneficiarioId");

-- CreateIndex
CREATE UNIQUE INDEX "donaciones_referenciaPasarela_key" ON "donaciones"("referenciaPasarela");

-- CreateIndex
CREATE UNIQUE INDEX "campanas_slug_key" ON "campanas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "historias_slug_key" ON "historias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "entradas_blog_slug_key" ON "entradas_blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- CreateIndex
CREATE INDEX "bitacora_entidad_idx" ON "bitacora"("entidad");

-- CreateIndex
CREATE INDEX "bitacora_accion_idx" ON "bitacora"("accion");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes_clinicos" ADD CONSTRAINT "expedientes_clinicos_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_clinicas" ADD CONSTRAINT "evaluaciones_clinicas_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_socioeconomicas" ADD CONSTRAINT "fichas_socioeconomicas_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "padrinos" ADD CONSTRAINT "padrinos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "padrinazgos" ADD CONSTRAINT "padrinazgos_padrinoId_fkey" FOREIGN KEY ("padrinoId") REFERENCES "padrinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "padrinazgos" ADD CONSTRAINT "padrinazgos_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_padrinoId_fkey" FOREIGN KEY ("padrinoId") REFERENCES "padrinos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
