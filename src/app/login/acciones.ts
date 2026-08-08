"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { EstadoFormulario } from "@/lib/formularios";

export async function iniciarSesion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const redirigir = String(datos.get("redirigir") ?? "") || "/inicio";

  try {
    await signIn("credentials", {
      email: String(datos.get("email") ?? "").toLowerCase(),
      password: String(datos.get("password") ?? ""),
      redirectTo: redirigir,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos, o la cuenta está inactiva." };
    }
    // signIn lanza un redirect que Next debe propagar.
    throw error;
  }

  return {};
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
