/**
 * Pone la tabla de permisos y la matriz rol→permiso al día con
 * `src/lib/rbac.ts`, sin tocar ningún otro dato.
 *
 * El seed hace lo mismo, pero vaciando la base entera. Cuando se añade un
 * permiso o se amplía un rol sobre una base que ya está en uso, esto es lo que
 * hay que correr:  npm run db:acceso
 *
 * Los usuarios conservan sus roles: aquí solo se reconcilian los permisos que
 * cada rol concede. Los permisos nuevos entran en vigor la próxima vez que
 * cada persona inicie sesión, porque es cuando se arma su token.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATALOGO_PERMISOS, CATALOGO_ROLES } from "../src/lib/rbac";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const permiso of CATALOGO_PERMISOS) {
    await prisma.permission.upsert({
      where: { clave: permiso.clave },
      create: {
        clave: permiso.clave,
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        modulo: permiso.modulo,
      },
      update: {
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        modulo: permiso.modulo,
      },
    });
  }

  // Un permiso que se retira del catálogo desaparece también de la base: si
  // no, seguiría concediéndose sin que nadie lo viera en el código.
  const vigentes = CATALOGO_PERMISOS.map((p) => p.clave);
  const sobrantes = await prisma.permission.deleteMany({
    where: { clave: { notIn: vigentes } },
  });

  for (const definicion of CATALOGO_ROLES) {
    const rol = await prisma.role.upsert({
      where: { clave: definicion.clave },
      create: {
        clave: definicion.clave,
        nombre: definicion.nombre,
        descripcion: definicion.descripcion,
      },
      update: { nombre: definicion.nombre, descripcion: definicion.descripcion },
      select: { id: true },
    });

    const permisos = await prisma.permission.findMany({
      where: { clave: { in: definicion.permisos } },
      select: { id: true },
    });
    const deben = permisos.map((p) => p.id);

    await prisma.rolePermission.deleteMany({
      where: { roleId: rol.id, permissionId: { notIn: deben } },
    });
    for (const permissionId of deben) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rol.id, permissionId } },
        create: { roleId: rol.id, permissionId },
        update: {},
      });
    }

    console.log(`${definicion.clave}: ${deben.length} permisos`);
  }

  if (sobrantes.count > 0) {
    console.log(`Se retiraron ${sobrantes.count} permisos que ya no están en el catálogo.`);
  }
  console.log("Acceso sincronizado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
