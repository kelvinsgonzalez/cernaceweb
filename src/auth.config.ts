import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compartida entre el runtime de Node (src/auth.ts) y el proxy.
 *
 * Nota de entorno: la augmentación de tipos de `next-auth/jwt` no se aplica en
 * este proyecto, así que en los callbacks hay que estrechar `user` y `token`
 * con un `as` explícito o TypeScript los tipa como `{}` y no compila.
 */

export type SesionUsuario = {
  id: string;
  nombre: string;
  email: string;
  roles: string[];
  permisos: string[];
  padrinoId: string | null;
};

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as SesionUsuario;
        const t = token as unknown as Record<string, unknown>;
        t.id = u.id;
        t.nombre = u.nombre;
        t.roles = u.roles;
        t.permisos = u.permisos;
        t.padrinoId = u.padrinoId;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as unknown as {
        id?: string;
        nombre?: string;
        roles?: string[];
        permisos?: string[];
        padrinoId?: string | null;
      };
      const s = session as unknown as { user: SesionUsuario };
      if (s.user) {
        s.user.id = t.id ?? "";
        s.user.nombre = t.nombre ?? "";
        s.user.roles = t.roles ?? [];
        s.user.permisos = t.permisos ?? [];
        s.user.padrinoId = t.padrinoId ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
