-- AlterTable
ALTER TABLE "seguimientos" ADD COLUMN     "registradoPorId" TEXT;

-- CreateTable
CREATE TABLE "planes_terapeuticos" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "objetivoGeneral" TEXT NOT NULL,
    "anotaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "aprobadoPor" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "fechaAprobacion" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_terapeuticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_terapeutas" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "terapeutaId" TEXT NOT NULL,
    "area" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "desde" DATE NOT NULL,
    "hasta" DATE,
    "asignadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_terapeutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_avances" (
    "id" TEXT NOT NULL,
    "seguimientoId" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_avances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planes_terapeuticos_beneficiarioId_key" ON "planes_terapeuticos"("beneficiarioId");

-- CreateIndex
CREATE INDEX "asignaciones_terapeutas_terapeutaId_idx" ON "asignaciones_terapeutas"("terapeutaId");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_terapeutas_beneficiarioId_terapeutaId_key" ON "asignaciones_terapeutas"("beneficiarioId", "terapeutaId");

-- CreateIndex
CREATE UNIQUE INDEX "fotos_avances_archivo_key" ON "fotos_avances"("archivo");

-- CreateIndex
CREATE INDEX "fotos_avances_seguimientoId_idx" ON "fotos_avances"("seguimientoId");

-- CreateIndex
CREATE INDEX "seguimientos_registradoPorId_idx" ON "seguimientos"("registradoPorId");

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_terapeuticos" ADD CONSTRAINT "planes_terapeuticos_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_terapeuticos" ADD CONSTRAINT "planes_terapeuticos_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_terapeutas" ADD CONSTRAINT "asignaciones_terapeutas_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_terapeutas" ADD CONSTRAINT "asignaciones_terapeutas_terapeutaId_fkey" FOREIGN KEY ("terapeutaId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_avances" ADD CONSTRAINT "fotos_avances_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "seguimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

