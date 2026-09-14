-- AlterTable
ALTER TABLE "historias" ADD COLUMN     "imagenAlt" TEXT,
ADD COLUMN     "imagenArchivo" TEXT,
ADD COLUMN     "imagenTipoMime" TEXT,
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0;
