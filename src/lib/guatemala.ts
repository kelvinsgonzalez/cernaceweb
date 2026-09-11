/**
 * División administrativa de Guatemala. Los departamentos son 22 y no cambian,
 * así que se eligen de una lista; los municipios sí varían y se escriben a
 * mano, que además deja registrar aldeas o caseríos como los dice la familia.
 *
 * Los valores predeterminados son los del área que atiende el centro: la mayor
 * parte de las solicitudes llegan de ahí y así la familia solo los corrige
 * cuando viene de otro lado.
 */

export const DEPARTAMENTOS = [
  "Alta Verapaz",
  "Baja Verapaz",
  "Chimaltenango",
  "Chiquimula",
  "El Progreso",
  "Escuintla",
  "Guatemala",
  "Huehuetenango",
  "Izabal",
  "Jalapa",
  "Jutiapa",
  "Petén",
  "Quetzaltenango",
  "Quiché",
  "Retalhuleu",
  "Sacatepéquez",
  "San Marcos",
  "Santa Rosa",
  "Sololá",
  "Suchitepéquez",
  "Totonicapán",
  "Zacapa",
] as const;

export const DEPARTAMENTO_PREDETERMINADO = "Huehuetenango";
export const MUNICIPIO_PREDETERMINADO = "Cuilco";
