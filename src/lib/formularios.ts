import { z } from "zod";
import { DEPARTAMENTOS } from "@/lib/guatemala";

export type EstadoFormulario = {
  ok?: string;
  error?: string;
  errores?: Record<string, string>;
};

export const ESTADO_INICIAL: EstadoFormulario = {};

export function erroresDeZod(error: z.ZodError): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !mapa[campo]) mapa[campo] = issue.message;
  }
  return mapa;
}

const texto = (min: number, mensaje: string) =>
  z.string().trim().min(min, mensaje);

export const esquemaInscripcionBeneficiario = z.object({
  nombreNino: texto(3, "Escribe el nombre completo del niño o adolescente."),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha de nacimiento válida."),
  sexo: z.enum(["MASCULINO", "FEMENINO"], {
    message: "Selecciona el sexo.",
  }),
  municipio: texto(2, "Escribe el municipio."),
  departamento: z.enum(DEPARTAMENTOS, {
    message: "Selecciona el departamento.",
  }),
  encargadoNombre: texto(3, "Escribe el nombre del encargado."),
  encargadoParentesco: texto(3, "Indica el parentesco con el beneficiario."),
  encargadoTelefono: texto(8, "Escribe un teléfono de contacto."),
  encargadoEmail: z
    .union([z.email("Escribe un correo válido."), z.literal("")])
    .optional(),
  diagnostico: z.string().trim().optional(),
  programaSolicitado: z.string().trim().optional(),
  comentarios: z.string().trim().optional(),
});

export const esquemaInscripcionPadrino = z
  .object({
    nombre: texto(3, "Escribe tu nombre completo."),
    email: z.email("Escribe un correo válido."),
    telefono: texto(8, "Escribe un teléfono de contacto."),
    ocupacion: z.string().trim().optional(),
    aporteMensual: z
      .string()
      .trim()
      .refine((v) => v === "" || Number(v) >= 50, {
        message: "El aporte mínimo sugerido es de Q50.",
      })
      .optional(),
    motivacion: z.string().trim().optional(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña no puede pasar de 72 caracteres."),
    passwordConfirmacion: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmacion, {
    message: "Las dos contraseñas no coinciden.",
    path: ["passwordConfirmacion"],
  });

export const esquemaContacto = z.object({
  nombre: texto(3, "Escribe tu nombre."),
  email: z.email("Escribe un correo válido."),
  telefono: z.string().trim().optional(),
  asunto: texto(3, "Escribe el asunto."),
  mensaje: texto(10, "Cuéntanos un poco más (al menos 10 caracteres)."),
});

/**
 * Aporte a una campaña desde la portada. Lo único obligatorio es la foto del
 * comprobante, que no pasa por Zod —se valida aparte con `validarBoleta`—.
 * El nombre y el mensaje son opcionales. El monto lo anota el administrador
 * al aprobar, porque está en la imagen que se sube.
 */
export const esquemaAporteCampana = z.object({
  campana: z.string().trim().max(120).optional(),
  deParteDe: z
    .string()
    .trim()
    .max(80, "El nombre no puede pasar de 80 caracteres.")
    .optional(),
  mensaje: z
    .string()
    .trim()
    .max(500, "El mensaje no puede pasar de 500 caracteres.")
    .optional(),
});

/**
 * Aporte de un padrino a su ahijado desde el portal: la foto del comprobante
 * y, si quiere, un mensaje de amor. Nada más; el niño y el padrino los pone
 * el servidor.
 */
export const esquemaAportePadrino = z.object({
  beneficiarioId: z.string().min(1),
  mensaje: z
    .string()
    .trim()
    .max(500, "El mensaje no puede pasar de 500 caracteres.")
    .optional(),
});

/** Verificación de una boleta desde el panel. */
export const esquemaVerificacionDonacion = z.object({
  id: z.string().min(1),
  decision: z.enum(["APROBAR", "RECHAZAR"], {
    message: "Indica si la boleta se acepta o se rechaza.",
  }),
  notaVerificacion: z.string().trim().max(500).optional(),
});
