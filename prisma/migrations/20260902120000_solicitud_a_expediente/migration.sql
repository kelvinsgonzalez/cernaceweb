-- AlterTable
ALTER TABLE "solicitudes_inscripcion" ADD COLUMN     "beneficiarioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_inscripcion_beneficiarioId_key" ON "solicitudes_inscripcion"("beneficiarioId");

-- AddForeignKey
ALTER TABLE "solicitudes_inscripcion" ADD CONSTRAINT "solicitudes_inscripcion_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
