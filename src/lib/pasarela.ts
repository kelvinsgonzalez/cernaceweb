/**
 * No hay pasarela de pago. Todo aporte, venga de donde venga, entra como una
 * foto de comprobante que el administrador coteja contra el estado de cuenta.
 * Lo que queda aquí es lo que sobrevive de aquel módulo: la referencia con la
 * que se localiza cada aporte, el catálogo de métodos para el reporte y las
 * cuentas a las que se deposita.
 */

const ALFABETO_REFERENCIA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Referencia corta y legible que sale en el comprobante. Con ella el equipo
 * localiza el aporte cuando el donante escribe.
 */
export function generarReferencia(): string {
  let sufijo = "";
  for (let i = 0; i < 6; i += 1) {
    sufijo += ALFABETO_REFERENCIA[Math.floor(Math.random() * ALFABETO_REFERENCIA.length)];
  }
  return `CER-${sufijo}`;
}

/**
 * Catálogo de métodos. El donante no lo elige: lo anota el administrador al
 * aprobar, leyendo la foto. TARJETA es un pago con tarjeta hecho fuera del
 * sitio (un POS, la banca en línea) del que también se sube el comprobante.
 */
export const METODOS_PAGO = [
  { valor: "DEPOSITO", etiqueta: "Depósito" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
  { valor: "TARJETA", etiqueta: "Pago con tarjeta" },
  { valor: "EFECTIVO", etiqueta: "Efectivo" },
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number]["valor"];

/** Método con el que nace un aporte hasta que el administrador lo anota. */
export const METODO_DEPOSITO: MetodoPago = "DEPOSITO";

export function etiquetaMetodo(valor: string): string {
  return METODOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor;
}

export function esMetodoPago(valor: string): valor is MetodoPago {
  return METODOS_PAGO.some((m) => m.valor === valor);
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

export type CampoCuenta = { etiqueta: string; valor: string; mono?: boolean };

/**
 * Las dos cuentas listas para pintar, a partir de la configuración guardada.
 * Lo usan la página de donar y el formulario de aporte del portal.
 */
export function cuentasParaDepositar(
  ajustes: { clave: string; valor: string }[],
): { moneda: string; campos: CampoCuenta[] }[] {
  const cuenta = (clave: string) =>
    ajustes.find((a) => a.clave === clave)?.valor ?? CUENTA_PREDETERMINADA[clave];
  return [
    {
      moneda: "Quetzales (GTQ)",
      campos: [
        { etiqueta: "Banco", valor: cuenta("donaciones.banco") },
        { etiqueta: "Tipo de cuenta", valor: cuenta("donaciones.cuentaTipo") },
        { etiqueta: "Número de cuenta", valor: cuenta("donaciones.cuentaNumero"), mono: true },
        { etiqueta: "A nombre de", valor: cuenta("donaciones.cuentaTitular") },
      ],
    },
    {
      moneda: "Dólares (USD)",
      campos: [
        { etiqueta: "Banco", valor: cuenta("donaciones.bancoDolares") },
        { etiqueta: "Número de cuenta", valor: cuenta("donaciones.cuentaDolaresNumero"), mono: true },
        { etiqueta: "A nombre de", valor: cuenta("donaciones.cuentaDolaresTitular") },
      ],
    },
  ];
}
