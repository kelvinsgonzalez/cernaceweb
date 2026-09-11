-- CreateTable
CREATE TABLE "fotos_expediente" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "descripcion" TEXT,
    "visibleParaPadrino" BOOLEAN NOT NULL DEFAULT false,
    "subidaPor" TEXT NOT NULL,
    "subidaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_expediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fotos_expediente_archivo_key" ON "fotos_expediente"("archivo");

-- CreateIndex
CREATE INDEX "fotos_expediente_beneficiarioId_idx" ON "fotos_expediente"("beneficiarioId");

-- AddForeignKey
ALTER TABLE "fotos_expediente" ADD CONSTRAINT "fotos_expediente_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_expediente" ADD CONSTRAINT "fotos_expediente_subidaPorId_fkey" FOREIGN KEY ("subidaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
