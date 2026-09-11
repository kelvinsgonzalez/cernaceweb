-- AlterTable
ALTER TABLE "beneficiarios" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_userId_key" ON "beneficiarios"("userId");

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

