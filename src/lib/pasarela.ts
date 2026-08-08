/**
 * Pasarela de pago — MODO PRUEBA.
 *
 * Dos reglas que no se rompen:
 *  1. Todo el flujo está en modo prueba y lo declara visiblemente.
 *  2. No se guardan datos de tarjeta. El flujo nunca pide un número de tarjeta.
 *
 * Cambiar a Stripe o PayPal debe consistir en sustituir la implementación de
 * `Pasarela` por otra, sin tocar el resto de la aplicación.
 */

export type IntencionPago = {
  referencia: string;
  monto: number;
  moneda: string;
  metodo: string;
};

export type ResultadoPago = {
  referencia: string;
  aprobado: boolean;
  mensaje: string;
};

export interface Pasarela {
  readonly nombre: string;
  readonly modoPrueba: boolean;
  crearIntencion(datos: {
    monto: number;
    moneda: string;
    metodo: string;
    descripcion: string;
  }): Promise<IntencionPago>;
  confirmar(referencia: string, aprobar: boolean): Promise<ResultadoPago>;
}

/** Referencia legible tipo CER-SIM-8F3K2Q. */
function generarReferencia(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufijo = "";
  for (let i = 0; i < 6; i += 1) {
    sufijo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `CER-SIM-${sufijo}`;
}

class PasarelaSimulada implements Pasarela {
  readonly nombre = "Pasarela simulada CERNACE";
  readonly modoPrueba = true;

  async crearIntencion(datos: {
    monto: number;
    moneda: string;
    metodo: string;
    descripcion: string;
  }): Promise<IntencionPago> {
    return {
      referencia: generarReferencia(),
      monto: datos.monto,
      moneda: datos.moneda,
      metodo: datos.metodo,
    };
  }

  async confirmar(referencia: string, aprobar: boolean): Promise<ResultadoPago> {
    return {
      referencia,
      aprobado: aprobar,
      mensaje: aprobar
        ? "Pago aprobado en modo prueba."
        : "Pago rechazado en modo prueba.",
    };
  }
}

export const pasarela: Pasarela = new PasarelaSimulada();

export const METODOS_PAGO = [
  { valor: "TARJETA", etiqueta: "Tarjeta de crédito o débito" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
  { valor: "DEPOSITO", etiqueta: "Depósito en agencia" },
] as const;

export function etiquetaMetodo(valor: string): string {
  return METODOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor;
}
