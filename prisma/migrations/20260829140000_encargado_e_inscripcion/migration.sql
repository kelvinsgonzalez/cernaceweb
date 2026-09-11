-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('PRIMER_INGRESO', 'REINGRESO');

-- CreateEnum
CREATE TYPE "SituacionLaboral" AS ENUM ('EMPLEADO', 'DESEMPLEADO');

-- CreateTable
CREATE TABLE "encargados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "parentesco" TEXT,
    "sexo" "Sexo",
    "edad" INTEGER,
    "noIdentificacion" TEXT,
    "estadoCivil" TEXT,
    "situacionLaboral" "SituacionLaboral",
    "escolaridad" TEXT,
    "oficio" TEXT,
    "integrantesFamilia" INTEGER,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encargados_pkey" PRIMARY KEY ("id")
);

-- AlterTable: primero solo se añaden las columnas nuevas.
ALTER TABLE "beneficiarios" ADD COLUMN     "encargadoId" TEXT,
ADD COLUMN     "escolaridad" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "telefono" TEXT;

-- Traspaso de los datos del encargado, que hasta ahora vivían embebidos en la
-- fila de cada beneficiario. Se agrupan por nombre y teléfono para que dos
-- hermanos con el mismo encargado compartan una sola ficha, que es justamente
-- lo que la tabla aparte viene a resolver.
INSERT INTO "encargados" ("id", "nombre", "parentesco", "telefono", "email", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    b."encargadoNombre",
    MIN(b."encargadoParentesco"),
    b."encargadoTelefono",
    MIN(b."encargadoEmail"),
    NOW(),
    NOW()
FROM "beneficiarios" b
WHERE b."encargadoNombre" IS NOT NULL
GROUP BY b."encargadoNombre", b."encargadoTelefono";

UPDATE "beneficiarios" b
SET "encargadoId" = e."id"
FROM "encargados" e
WHERE e."nombre" = b."encargadoNombre"
  AND e."telefono" IS NOT DISTINCT FROM b."encargadoTelefono";

-- Ya trasladados, las columnas viejas sobran.
ALTER TABLE "beneficiarios" DROP COLUMN "encargadoEmail",
DROP COLUMN "encargadoNombre",
DROP COLUMN "encargadoParentesco",
DROP COLUMN "encargadoTelefono";

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "fechaInscripcion" DATE NOT NULL,
    "tipoIngreso" "TipoIngreso" NOT NULL,
    "fechaPrimerIngreso" DATE,
    "referidoPor" TEXT,
    "areaServicio" TEXT,
    "impresionClinica" TEXT,
    "otrasEnfermedades" TEXT,
    "responsableInscripcion" TEXT NOT NULL,
    "voBo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encargados_noIdentificacion_idx" ON "encargados"("noIdentificacion");

-- CreateIndex
CREATE INDEX "inscripciones_ciclo_idx" ON "inscripciones"("ciclo");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_beneficiarioId_ciclo_key" ON "inscripciones"("beneficiarioId", "ciclo");

-- CreateIndex
CREATE INDEX "beneficiarios_encargadoId_idx" ON "beneficiarios"("encargadoId");

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_encargadoId_fkey" FOREIGN KEY ("encargadoId") REFERENCES "encargados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

