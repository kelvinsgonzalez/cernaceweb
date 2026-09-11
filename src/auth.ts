import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig, type SesionUsuario } from "@/auth.config";

const esquemaCredenciales = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales) {
        const parseo = esquemaCredenciales.safeParse(credenciales);
        if (!parseo.success) return null;

        const { email, password } = parseo.data;
        const usuario = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            padrino: { select: { id: true } },
            beneficiario: { select: { id: true } },
            roles: {
              include: {
                role: { include: { permisos: { include: { permission: true } } } },
              },
            },
          },
        });

        if (!usuario || !usuario.activo) return null;

        const valida = await bcrypt.compare(password, usuario.passwordHash);
        if (!valida) return null;

        await prisma.user.update({
          where: { id: usuario.id },
          data: { ultimoAcceso: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            actor: usuario.email,
            accion: "INICIO_SESION",
            entidad: "User",
            entidadId: usuario.id,
            detalle: `${usuario.nombre} inició sesión`,
          },
        });

        const roles = usuario.roles.map((ur) => ur.role.clave);
        const permisos = Array.from(
          new Set(
            usuario.roles.flatMap((ur) =>
              ur.role.permisos.map((rp) => rp.permission.clave),
            ),
          ),
        );

        const sesion: SesionUsuario = {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          roles,
          permisos,
          padrinoId: usuario.padrino?.id ?? null,
          beneficiarioId: usuario.beneficiario?.id ?? null,
        };

        // next-auth espera un `User`; el resto de campos viaja al callback jwt.
        return sesion as unknown as { id: string };
      },
    }),
  ],
});
