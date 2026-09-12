-- Las cuentas reales a las que se deposita: la de quetzales en Guatemala y la
-- de dólares en Estados Unidos, que antes solo estaban en el sitio anterior.

-- Los valores de la cuenta en quetzales eran marcadores; solo se sustituyen si
-- nadie los corrigió ya desde Configuración.
UPDATE "configuracion" SET "valor" = 'Banrural, Guatemala', "updatedAt" = now()
WHERE "clave" = 'donaciones.banco' AND "valor" = 'Banrural';

UPDATE "configuracion" SET "valor" = '353105163', "updatedAt" = now()
WHERE "clave" = 'donaciones.cuentaNumero' AND "valor" = '3-000-00000-0';

UPDATE "configuracion"
SET "valor" = 'Asociación Unidos para Ayudar al Desarrollo Integral de los Pueblos',
    "updatedAt" = now()
WHERE "clave" = 'donaciones.cuentaTitular' AND "valor" = 'Asociación CERNACE';

-- La cuenta en dólares es nueva: sirve a quien dona desde el extranjero.
INSERT INTO "configuracion" ("id", "clave", "valor", "descripcion", "grupo", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'donaciones.bancoDolares', 'Chase Bank, Estados Unidos', 'Banco de la cuenta en dólares, para donativos desde el extranjero.', 'donaciones', now()),
  (gen_random_uuid()::text, 'donaciones.cuentaDolaresNumero', '643788912', 'Número de la cuenta en dólares para depósitos y transferencias.', 'donaciones', now()),
  (gen_random_uuid()::text, 'donaciones.cuentaDolaresTitular', 'Isaías Gálvez', 'A nombre de quién está la cuenta en dólares.', 'donaciones', now())
ON CONFLICT ("clave") DO NOTHING;
