-- El banco de la cuenta en quetzales se muestra con su nombre completo, tal
-- como aparece en la boleta: "Banco Banrural Guatemala".
UPDATE "configuracion" SET "valor" = 'Banco Banrural Guatemala', "updatedAt" = now()
WHERE "clave" = 'donaciones.banco' AND "valor" = 'Banrural, Guatemala';
