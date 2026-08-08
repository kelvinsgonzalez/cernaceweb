import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Next 16 deprecó `middleware.ts`: el archivo se llama `src/proxy.ts` y
 * exporta un default con la misma firma.
 *
 * Esto solo redirige a /login a quien no tiene sesión. Es conveniencia de
 * navegación, NO la barrera de seguridad: la autorización real vive en
 * `requirePermiso()`, en cada página y cada server action.
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
  matcher: ["/admin/:path*", "/portal/:path*", "/inicio"],
};
