/**
 * Pasarela en modo prueba: no se piden ni se guardan datos de tarjeta.
 * Migrar a Stripe o PayPal debe limitarse a sustituir la implementación de
 * `Pasarela`, sin tocar el resto de la aplicación.
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

/**
 * La tarjeta la resuelve la pasarela; la transferencia y el depósito los
 * resuelve el banco y llegan aquí como una boleta que alguien del equipo tiene
 * que cotejar antes de dar la donación por buena.
 */
export const METODOS_CON_BOLETA = ["TRANSFERENCIA", "DEPOSITO"] as const;

export function requiereBoleta(metodo: string): boolean {
  return METODOS_CON_BOLETA.includes(
    metodo as (typeof METODOS_CON_BOLETA)[number],
  );
}

/** Claves de configuración con la cuenta a la que se deposita. */
export const CLAVES_CUENTA = [
  "donaciones.banco",
  "donaciones.cuentaNumero",
  "donaciones.cuentaTipo",
  "donaciones.cuentaTitular",
] as const;

/** Se usan si la configuración todavía no trae la cuenta. */
export const CUENTA_PREDETERMINADA: Record<string, string> = {
  "donaciones.banco": "Banrural",
  "donaciones.cuentaNumero": "3-000-00000-0",
  "donaciones.cuentaTipo": "Monetaria",
  "donaciones.cuentaTitular": "Asociación CERNACE",
};
