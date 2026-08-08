import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 lee la configuración de aquí, no de package.json.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Prisma 7 sacó `url` del bloque datasource del schema: la URL de migración
  // vive aquí y el cliente en runtime la recibe vía driver adapter.
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
