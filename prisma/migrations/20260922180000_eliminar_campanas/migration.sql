-- Borrado lógico de campañas: la fila se queda para que los informes y las
-- recaudaciones no pierdan el nombre ni los montos; las fotos y la campaña
-- desaparecen del panel y de la portada.
ALTER TABLE "campanas" ADD COLUMN "eliminadaEn" TIMESTAMP(3);
