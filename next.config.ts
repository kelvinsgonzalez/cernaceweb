import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El dev server bloquea peticiones cross-origin: sin esto, el túnel de
  // Cloudflare no puede pedir los recursos de desarrollo (HMR incluido).
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
