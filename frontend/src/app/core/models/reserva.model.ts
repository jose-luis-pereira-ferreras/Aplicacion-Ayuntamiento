import type { Reserva } from './modelos';

export const ESTADO_CONFIRMADA = 'confirmada';
export const ESTADO_CANCELADA = 'cancelada';

export const ESTADOS: { valor: string; etiqueta: string }[] = [
  { valor: ESTADO_CONFIRMADA, etiqueta: 'Confirmada' },
  { valor: ESTADO_CANCELADA, etiqueta: 'Cancelada' },
];

/**
 * Normaliza una reserva a la "forma de lectura".
 *
 * La API es asimetrica:
 *   GET      -> { id, usuario_nombre, espacio_nombre, fecha, hora_inicio, hora_fin, estado }
 *   POST/PUT -> { id, usuario_id, espacio_id, fecha, hora_inicio, hora_fin, estado }
 *
 * Normalizamos ambas a la forma de lectura para que la aplicacion trabaje
 * siempre con un unico modelo. Tras un POST/PUT el servicio vuelve a pedir la
 * reserva por id, de modo que aqui siempre llegan los nombres.
 */
export function crearReserva(datos: Partial<Reserva>): Reserva {
  return {
    id: datos.id as number,
    usuario_nombre: datos.usuario_nombre ?? null,
    espacio_nombre: datos.espacio_nombre ?? null,
    usuario_id: datos.usuario_id ?? null,
    espacio_id: datos.espacio_id ?? null,
    fecha: datos.fecha ?? '',
    hora_inicio: datos.hora_inicio ?? '',
    hora_fin: datos.hora_fin ?? '',
    estado: datos.estado ?? ESTADO_CONFIRMADA,
  };
}

export function estaConfirmada(reserva: Reserva): boolean {
  return reserva.estado === ESTADO_CONFIRMADA;
}

/**
 * El backend no expone espacio_id en las lecturas, asi que la vinculacion con
 * un espacio concreto se hace por nombre.
 */
export function esDeEspacio(reserva: Reserva, nombreEspacio: string): boolean {
  return (reserva.espacio_nombre ?? '') === (nombreEspacio ?? '');
}

export function deEspacio(reservas: Reserva[], nombreEspacio: string): Reserva[] {
  return reservas.filter((reserva) => esDeEspacio(reserva, nombreEspacio));
}

export function etiquetaEstado(estado: string): string {
  return ESTADOS.find((item) => item.valor === estado)?.etiqueta ?? estado;
}

/** Ordena por fecha y hora de inicio, de mas antiguo a mas reciente. */
export function ordenarPorFecha(reservas: Reserva[]): Reserva[] {
  return [...reservas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio),
  );
}
