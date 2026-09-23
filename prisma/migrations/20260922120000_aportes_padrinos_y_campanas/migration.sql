-- Aportes de padrinos a niños y campañas con fotos.
--
-- La donación gana el niño, el compromiso y la cuenta de quien la hizo, para
-- poder sumar por código de expediente. El padrinazgo gana una caducidad
-- opcional y la suspensión de avances. La campaña gana descripción corta,
-- fotos y la general «Aportar a lo que se necesite»; lo recaudado deja de
-- escribirse a mano y se calcula de los aportes aprobados. Los eventos se
-- retiran: no hay eventos presenciales ni entradas.

-- CreateEnum
CREATE TYPE "TipoAporte" AS ENUM ('APADRINAMIENTO', 'CAMPANA', 'GENERAL');

-- Donaciones: de dónde vienen y a dónde van
ALTER TABLE "donaciones"
  ADD COLUMN "tipo" "TipoAporte" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "beneficiarioId" TEXT,
  ADD COLUMN "padrinazgoId" TEXT,
  ADD COLUMN "usuarioId" TEXT,
  ADD COLUMN "mensajeVisibleFamilia" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_beneficiarioId_fkey"
  FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_padrinazgoId_fkey"
  FOREIGN KEY ("padrinazgoId") REFERENCES "padrinazgos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "donaciones_beneficiarioId_idx" ON "donaciones"("beneficiarioId");
CREATE INDEX "donaciones_padrinoId_idx" ON "donaciones"("padrinoId");
CREATE INDEX "donaciones_campaignId_idx" ON "donaciones"("campaignId");

-- Datos: lo que ya traía campaña es de campaña; lo que traía padrino sin
-- campaña es un aporte de apadrinamiento. El resto queda como general.
UPDATE "donaciones" SET "tipo" = 'CAMPANA' WHERE "campaignId" IS NOT NULL;
UPDATE "donaciones" SET "tipo" = 'APADRINAMIENTO' WHERE "campaignId" IS NULL AND "padrinoId" IS NOT NULL;

-- Padrinazgos: caducidad opcional y suspensión de avances
ALTER TABLE "padrinazgos"
  ADD COLUMN "caducaEl" DATE,
  ADD COLUMN "avancesSuspendidos" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "avisoAtendidoEl" TIMESTAMP(3);

-- Campañas: descripción corta, general, y lo recaudado se calcula
ALTER TABLE "campanas"
  ADD COLUMN "resumen" TEXT,
  ADD COLUMN "general" BOOLEAN NOT NULL DEFAULT false,
  DROP COLUMN "recaudado";

CREATE TABLE "fotos_campana" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_campana_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fotos_campana_campaignId_idx" ON "fotos_campana"("campaignId");

ALTER TABLE "fotos_campana" ADD CONSTRAINT "fotos_campana_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "campanas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datos: la campaña general existe desde el principio y solo hay una.
INSERT INTO "campanas" ("id", "titulo", "slug", "resumen", "descripcion", "meta", "fechaInicio", "fechaFin", "activa", "general", "imagenUrl", "createdAt", "updatedAt")
SELECT
    replace(gen_random_uuid()::text, '-', ''),
    'Aportar a lo que se necesite',
    'aportar-a-lo-que-se-necesite',
    'Tu aporte se usa donde más haga falta: terapias, material adaptado y transporte de las familias.',
    'Los aportes que no van dirigidos a un niño ni a una campaña concreta sostienen el día a día del centro: sesiones de terapia, material adaptado, medicamentos e insumos, y el transporte de las familias hasta el centro.',
    0,
    CURRENT_DATE,
    NULL,
    true,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "campanas" WHERE "general" = true);

-- Eventos: se retiran
DROP TABLE "eventos";
