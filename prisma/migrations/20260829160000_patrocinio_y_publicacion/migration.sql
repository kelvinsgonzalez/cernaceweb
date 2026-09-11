-- AlterTable
ALTER TABLE "beneficiarios" ADD COLUMN     "fotoArchivo" TEXT,
ADD COLUMN     "solicitaPatrocinio" BOOLEAN NOT NULL DEFAULT false;

-- Las fotos dejan de servirse desde public/ y pasan al almacenamiento con
-- control de acceso: de la ruta anterior solo sobrevive el nombre del archivo.
UPDATE "beneficiarios"
SET "fotoArchivo" = regexp_replace("fotoUrl", '^.*/', '')
WHERE "fotoUrl" IS NOT NULL;

-- Quien ya estaba publicado en la galería es porque se le buscaba padrino.
UPDATE "beneficiarios" SET "solicitaPatrocinio" = true WHERE "publicadoEnGaleria";

ALTER TABLE "beneficiarios" DROP COLUMN "fotoUrl";

