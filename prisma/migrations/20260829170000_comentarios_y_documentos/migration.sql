-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "archivo" TEXT,
ADD COLUMN     "subidoPorId" TEXT,
ADD COLUMN     "visibleParaPadrino" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "comentarios_avances" (
    "id" TEXT NOT NULL,
    "seguimientoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_avances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comentarios_avances_seguimientoId_idx" ON "comentarios_avances"("seguimientoId");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_avances" ADD CONSTRAINT "comentarios_avances_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "seguimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_avances" ADD CONSTRAINT "comentarios_avances_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Los documentos dejan de referenciarse por una ruta y pasan al almacenamiento
-- con control de acceso. De las filas anteriores no hay archivo que mover: se
-- conservan como registro de que el documento existe, sin adjunto.
ALTER TABLE "documentos" DROP COLUMN "url";
