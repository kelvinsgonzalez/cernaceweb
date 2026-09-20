-- Las terapias pasan a vivir en su propia tabla, varias por beneficiario.
-- El programa deja de atar al beneficiario: queda solo como referencia de la
-- landing. Los datos existentes se conservan: el programa de cada niño se
-- convierte en su primera terapia y las terapias del expediente clínico se
-- suman a continuación, sin repetir nombres.

-- CreateTable
CREATE TABLE "terapias_beneficiario" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "detalle" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terapias_beneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terapias_beneficiario_beneficiarioId_idx" ON "terapias_beneficiario"("beneficiarioId");

-- AddForeignKey
ALTER TABLE "terapias_beneficiario" ADD CONSTRAINT "terapias_beneficiario_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datos: el programa actual de cada beneficiario es su primera terapia.
INSERT INTO "terapias_beneficiario" ("id", "beneficiarioId", "nombre", "detalle", "orden", "createdAt", "updatedAt")
SELECT
    replace(gen_random_uuid()::text, '-', ''),
    b."id",
    p."nombre",
    NULL,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "beneficiarios" b
JOIN "programas" p ON p."id" = b."programaId";

-- Datos: las terapias del expediente clínico, en su orden, sin repetir las
-- que ya entraron por el programa.
INSERT INTO "terapias_beneficiario" ("id", "beneficiarioId", "nombre", "detalle", "orden", "createdAt", "updatedAt")
SELECT
    replace(gen_random_uuid()::text, '-', ''),
    ec."beneficiarioId",
    btrim(t."nombre"),
    NULL,
    t."ord"::integer,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "expedientes_clinicos" ec
CROSS JOIN LATERAL unnest(ec."terapias") WITH ORDINALITY AS t("nombre", "ord")
WHERE btrim(t."nombre") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "terapias_beneficiario" tb
    WHERE tb."beneficiarioId" = ec."beneficiarioId"
      AND lower(tb."nombre") = lower(btrim(t."nombre"))
  );

-- DropForeignKey
ALTER TABLE "beneficiarios" DROP CONSTRAINT "beneficiarios_programaId_fkey";

-- DropIndex
DROP INDEX "beneficiarios_programaId_idx";

-- AlterTable
ALTER TABLE "beneficiarios" DROP COLUMN "programaId";

-- AlterTable
ALTER TABLE "expedientes_clinicos" DROP COLUMN "terapias";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "curriculum" TEXT;
