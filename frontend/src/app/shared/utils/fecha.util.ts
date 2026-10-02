/**
 * Utilidades de fecha en formato ISO corto (YYYY-MM-DD), que es el que usa la
 * API. Se trabaja siempre con fechas locales: `new Date('2024-10-15')` se
 * interpretaria como UTC y en husos negativos seria del dia anterior.
 */

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/** Una fecha concreta, sin componente horario ni marcas de tiempo. */
export type FechaIso = string;

function dosDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

export function aIso(fecha: Date | FechaIso | null | undefined): FechaIso {
  if (!fecha) {
    return '';
  }
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${dosDigitos(date.getMonth() + 1)}-${dosDigitos(date.getDate())}`;
}

export function desdeIso(iso: unknown): Date | null {
  if (typeof iso !== 'string') {
    return null;
  }
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (anio === undefined || mes === undefined || dia === undefined) {
    return null;
  }
  const date = new Date(anio, mes - 1, dia);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hoyIso(): FechaIso {
  return aIso(new Date());
}

export function esIsoValido(iso: unknown): iso is FechaIso {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }
  const date = desdeIso(iso);
  if (!date) {
    return false;
  }
  // Descarta fechas como 2026-02-31, que el backend acepta por su regex.
  return aIso(date) === iso;
}

export function esFechaPasada(iso: unknown): boolean {
  return typeof iso === 'string' && iso !== '' && iso < hoyIso();
}

export function sumaDias(iso: FechaIso, dias: number): FechaIso {
  const date = desdeIso(iso);
  if (!date) {
    return iso;
  }
  date.setDate(date.getDate() + dias);
  return aIso(date);
}

/** "lunes, 14 de octubre de 2024" */
export function fechaLarga(iso: unknown): string {
  const date = desdeIso(iso);
  if (!date) {
    return '';
  }
  const dia = date.getDate();
  const mes = MESES[date.getMonth()];
  return `${DIAS[date.getDay()]}, ${dia} de ${mes} de ${date.getFullYear()}`;
}

/** "14 oct" */
export function fechaCorta(iso: unknown): string {
  const date = desdeIso(iso);
  if (!date) {
    return '';
  }
  return `${date.getDate()} ${MESES[date.getMonth()].slice(0, 3)}`;
}

export function nombreDia(iso: unknown): string {
  const date = desdeIso(iso);
  return date ? DIAS[date.getDay()] : '';
}
