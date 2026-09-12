-- El donativo directo se sube sin identificarse y sin declarar monto: quien
-- deposita solo adjunta la boleta y, si quiere, escribe a qué niño va dirigida.
ALTER TABLE "donaciones" ALTER COLUMN "donanteNombre" DROP NOT NULL;
ALTER TABLE "donaciones" ALTER COLUMN "donanteEmail" DROP NOT NULL;
ALTER TABLE "donaciones" ALTER COLUMN "monto" DROP NOT NULL;

-- Texto libre: el código o el nombre del niño tal como lo escribió el donante.
ALTER TABLE "donaciones" ADD COLUMN "destinoNino" TEXT;
