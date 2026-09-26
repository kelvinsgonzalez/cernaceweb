/**
 * Crea (o actualiza la contraseña de) la primera cuenta de administrador en una
 * base que no se sembró con datos de demostración.
 *
 *   ADMIN_EMAIL=alguien@cernace.org ADMIN_PASSWORD='...' npm run db:admin
 *
 * Con Docker: docker compose exec -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... app npm run db:admin
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ROLES } from "../src/lib/rbac";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE?.trim() || "Administrador";

  if (!email || !password) {
    throw new Error("Faltan ADMIN_EMAIL y ADMIN_PASSWORD.");
  }
  if (password.length < 10) {
    throw new Error("La contraseña debe tener al menos 10 caracteres.");
  }

  const rol = await prisma.role.findUnique({ where: { clave: ROLES.ADMIN } });
  if (!rol) {
    throw new Error(
      "No existe el rol ADMIN: ejecuta antes `npm run db:acceso` (el contenedor lo hace al arrancar).",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.user.upsert({
    where: { email },
    create: {
      nombre,
      email,
      passwordHash,
      roles: { create: [{ role: { connect: { id: rol.id } } }] },
    },
    update: { passwordHash, activo: true },
  });

  const yaEsAdmin = await prisma.userRole.findFirst({
    where: { userId: usuario.id, roleId: rol.id },
  });
  if (!yaEsAdmin) {
    await prisma.userRole.create({ data: { userId: usuario.id, roleId: rol.id } });
  }

  console.log(`✓ Cuenta de administrador lista: ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
