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

/**
 * Catálogo de etiquetas, no un menú: el sitio ya no pregunta el método. Quien
 * paga en línea entra por TARJETA y quien deposita en el banco por DEPOSITO.
 * TRANSFERENCIA sigue aquí porque hay aportes antiguos registrados así.
 */
export const METODOS_PAGO = [
  { valor: "TARJETA", etiqueta: "Tarjeta de crédito o débito" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
  { valor: "DEPOSITO", etiqueta: "Depósito o transferencia" },
] as const;

/** Método con el que se registra un donativo depositado en el banco. */
export const METODO_DEPOSITO = "DEPOSITO";

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

/**
 * Claves de configuración con las dos cuentas a las que se deposita: la de
 * quetzales en Guatemala y la de dólares en Estados Unidos.
 */
export const CLAVES_CUENTA = [
  "donaciones.banco",
  "donaciones.cuentaNumero",
  "donaciones.cuentaTipo",
  "donaciones.cuentaTitular",
  "donaciones.bancoDolares",
  "donaciones.cuentaDolaresNumero",
  "donaciones.cuentaDolaresTitular",
] as const;

/** Se usan si la configuración todavía no trae las cuentas. */
export const CUENTA_PREDETERMINADA: Record<string, string> = {
  "donaciones.banco": "Banco Banrural Guatemala",
  "donaciones.cuentaNumero": "353105163",
  "donaciones.cuentaTipo": "Monetaria",
  "donaciones.cuentaTitular":
    "Asociación Unidos para Ayudar al Desarrollo Integral de los Pueblos",
  "donaciones.bancoDolares": "Chase Bank, Estados Unidos",
  "donaciones.cuentaDolaresNumero": "643788912",
  "donaciones.cuentaDolaresTitular": "Isaías Gálvez",
};
