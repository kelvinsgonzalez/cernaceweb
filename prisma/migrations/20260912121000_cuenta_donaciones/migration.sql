-- Datos de la cuenta bancaria que ve quien dona por transferencia o depósito.
-- Van en configuración y no en el código para poder corregirlos sin desplegar.
-- Los valores son marcadores: hay que sustituirlos por la cuenta real.
INSERT INTO "configuracion" ("id", "clave", "valor", "descripcion", "grupo", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'donaciones.banco', 'Banrural', 'Banco de la cuenta a la que se deposita, visible al donar.', 'donaciones', now()),
  (gen_random_uuid()::text, 'donaciones.cuentaTipo', 'Monetaria', 'Tipo de cuenta que se muestra al donante.', 'donaciones', now()),
  (gen_random_uuid()::text, 'donaciones.cuentaNumero', '3-000-00000-0', 'Número de cuenta para transferencias y depósitos.', 'donaciones', now()),
  (gen_random_uuid()::text, 'donaciones.cuentaTitular', 'Asociación CERNACE', 'A nombre de quién está la cuenta bancaria.', 'donaciones', now())
ON CONFLICT ("clave") DO NOTHING;
