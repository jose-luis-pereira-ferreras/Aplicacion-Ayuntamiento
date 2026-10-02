import { ESTADO_CONFIRMADA } from '../../core/models/reserva.model';
import type { Reserva } from '../../core/models/modelos';
import { esIsoValido } from './fecha.util';

export const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const HORA_INICIO_POR_DEFECTO = '09:00';
export const HORA_FIN_POR_DEFECTO = '10:00';
export const HORA_APERTURA = 8;
export const HORA_CIERRE = 22;
export const DIAS_HABILES_POR_DEFECTO = 12;

/** Campos que el formulario de reserva manipula. */
export interface DatosReserva {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

/** Contexto necesario para detectar choques con reservas ya creadas. */
export interface ContextoReserva {
  /** Las lecturas de la API no traen espacio_id, asi que se compara por nombre. */
  espacioNombre?: string;
  reservas?: Reserva[];
  /** Reserva que se esta editando: se ignora a si misma. */
  excluirId?: number | null;
}

/** Errores por campo. Solo aparecen los que han fallado. */
export type ErroresReserva = Partial<Record<keyof DatosReserva, string>>;

export interface ResultadoValidacion {
  errores: ErroresReserva;
  solapamientos: Reserva[];
  valido: boolean;
}

/**
 * Comparacion de intervalos semiabiertos: dos franjas que solo se tocan
 * (11:30) NO se solapan, que es exactamente la logica del backend.
 */
export function solapa(
  horaInicioA: string,
  horaFinA: string,
  horaInicioB: string,
  horaFinB: string,
): boolean {
  return horaInicioA < horaFinB && horaFinA > horaInicioB;
}

function aMinutos(hora: string): number {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

/** Duracion en horas, admitiendo franjas que cruzan medianoche. */
export function horasEntre(horaInicio: string, horaFin: string): number {
  if (!RE_HORA.test(horaInicio) || !RE_HORA.test(horaFin)) {
    return 0;
  }
  const diferencia = aMinutos(horaFin) - aMinutos(horaInicio);
  return diferencia > 0 ? diferencia / 60 : (diferencia + 24 * 60) / 60;
}

/** "1 h 30 min" */
export function formateaHoras(horas: number | null | undefined): string {
  if (!horas) {
    return '0 h';
  }
  const entero = Math.floor(horas);
  const minutos = Math.round((horas - entero) * 60);
  if (entero === 0) {
    return `${minutos} min`;
  }
  return minutos === 0 ? `${entero} h` : `${entero} h ${minutos} min`;
}

/** La franja cae dentro del horario de apertura de instalaciones. */
export function dentroDeHorario(horaInicio: string, horaFin: string): boolean {
  return (
    RE_HORA.test(horaInicio) &&
    RE_HORA.test(horaFin) &&
    horaInicio >= `${String(HORA_APERTURA).padStart(2, '0')}:00` &&
    horaFin <= `${String(HORA_CIERRE).padStart(2, '0')}:00`
  );
}

/**
 * Validacion de una reserva por adelantado.
 *
 * El backend solo comprueba el formato de fecha y hora y el solapamiento, pero
 * NO comprueba que hora_fin sea posterior a hora_inicio, asi que ese hueco se
 * cubre aqui.
 */
export function validarReserva(
  datos: Partial<DatosReserva>,
  contexto: ContextoReserva = {},
): ResultadoValidacion {
  const { fecha = '', hora_inicio: horaInicio = '', hora_fin: horaFin = '' } = datos ?? {};
  const { espacioNombre = '', reservas = [], excluirId = null } = contexto;

  const errores: ErroresReserva = {};

  if (!fecha) {
    errores.fecha = 'Selecciona una fecha.';
  } else if (!RE_FECHA.test(fecha) || !esIsoValido(fecha)) {
    errores.fecha = 'La fecha no es válida.';
  }

  if (!horaInicio) {
    errores.hora_inicio = 'Indica la hora de inicio.';
  } else if (!RE_HORA.test(horaInicio)) {
    errores.hora_inicio = 'La hora debe tener el formato HH:MM.';
  }

  if (!horaFin) {
    errores.hora_fin = 'Indica la hora de fin.';
  } else if (!RE_HORA.test(horaFin)) {
    errores.hora_fin = 'La hora debe tener el formato HH:MM.';
  }

  const formatoValido = RE_HORA.test(horaInicio) && RE_HORA.test(horaFin) && esIsoValido(fecha);

  if (formatoValido && horaFin <= horaInicio) {
    errores.hora_fin = 'La hora de fin debe ser posterior a la de inicio.';
  } else if (formatoValido && !dentroDeHorario(horaInicio, horaFin)) {
    errores.hora_fin = `El horario de la instalación es de ${HORA_APERTURA}:00 a ${HORA_CIERRE}:00.`;
  }

  const solapamientos =
    formatoValido && !errores.hora_fin
      ? reservas.filter(
          (reserva) =>
            reserva.estado === ESTADO_CONFIRMADA &&
            reserva.fecha === fecha &&
            (reserva.espacio_nombre ?? '') === espacioNombre &&
            reserva.id !== excluirId &&
            solapa(horaInicio, horaFin, reserva.hora_inicio, reserva.hora_fin),
        )
      : [];

  return {
    errores,
    solapamientos,
    valido: Object.keys(errores).length === 0 && solapamientos.length === 0,
  };
}
