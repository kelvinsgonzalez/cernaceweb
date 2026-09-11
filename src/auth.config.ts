import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compartida entre src/auth.ts y el proxy.
 *
 * La augmentación de tipos de `next-auth/jwt` no se aplica en este proyecto, así
 * que los callbacks estrechan `user` y `token` con un `as` explícito; sin él
 * TypeScript los tipa como `{}`.
 */

export type SesionUsuario = {
  id: string;
  nombre: string;
  email: string;
  roles: string[];
  permisos: string[];
  padrinoId: string | null;
  beneficiarioId: string | null;
};

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  /**
   * Las cookies llevan nombre propio en vez del `authjs.*` de serie.
   *
   * En localhost las cookies se comparten entre puertos: cualquier otra
   * aplicación con Auth.js corriendo en la misma máquina deja su
   * `authjs.session-token` y este servidor intenta descifrarla con su secreto,
   * que no es el mismo. El resultado es un JWTSessionError en cada petición.
   * Con un nombre propio, esa cookie ajena sencillamente se ignora.
   *
   * Solo se cambia el nombre: las opciones (httpOnly, sameSite, secure) las
   * sigue calculando Auth.js según el entorno, que es quien sabe si la conexión
   * va por HTTPS.
   */
  cookies: {
    sessionToken: { name: "cernace.session-token" },
    csrfToken: { name: "cernace.csrf-token" },
    callbackUrl: { name: "cernace.callback-url" },
  },
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
        t.beneficiarioId = u.beneficiarioId;
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
        beneficiarioId?: string | null;
      };
      const s = session as unknown as { user: SesionUsuario };
      if (s.user) {
        s.user.id = t.id ?? "";
        s.user.nombre = t.nombre ?? "";
        s.user.roles = t.roles ?? [];
        s.user.permisos = t.permisos ?? [];
        s.user.padrinoId = t.padrinoId ?? null;
        s.user.beneficiarioId = t.beneficiarioId ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
