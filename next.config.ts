import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El dev server bloquea peticiones cross-origin: sin esto, el túnel de
  // Cloudflare no puede pedir los recursos de desarrollo (HMR incluido).
  allowedDevOrigins: ["*.trycloudflare.com"],

  experimental: {
    serverActions: {
      // Los formularios suben archivos por server action, y el tope de Next son
      // 1 MB: con eso ni una foto de móvil pasa. La subida más grande del sitio
      // son las 8 fotos de 5 MB de un expediente (MAXIMO_FOTOS_EXPEDIENTE y
      // TAMANO_MAXIMO en src/lib/almacenamiento.ts); el resto —boleta y
      // documentos, 10 MB— cabe de sobra. Se deja margen para lo que el
      // multipart añade en cabeceras y separadores.
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
