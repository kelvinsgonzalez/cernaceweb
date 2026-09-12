-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "boletaArchivo" TEXT,
ADD COLUMN     "boletaBanco" TEXT,
ADD COLUMN     "boletaFecha" DATE,
ADD COLUMN     "boletaNumero" TEXT,
ADD COLUMN     "boletaSubidaEn" TIMESTAMP(3),
ADD COLUMN     "boletaTamanoBytes" INTEGER,
ADD COLUMN     "boletaTipoMime" TEXT,
ADD COLUMN     "notaVerificacion" TEXT,
ADD COLUMN     "verificadaEn" TIMESTAMP(3),
ADD COLUMN     "verificadaPor" TEXT;
