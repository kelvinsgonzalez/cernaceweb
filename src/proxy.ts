import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Sustituye a `middleware.ts`, deprecado en Next 16. Solo redirige a /login a
 * quien no tiene sesión: la autorización real vive en `requirePermiso()`.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const autenticado = Boolean(req.auth);

  if (!autenticado) {
    const destino = new URL("/login", nextUrl.origin);
    destino.searchParams.set("redirigir", nextUrl.pathname);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/mi-expediente/:path*", "/inicio"],
};
