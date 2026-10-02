import { describe, expect, it } from 'vitest';
import {
  dentroDeHorario,
  formateaHoras,
  horasEntre,
  solapa,
  validarReserva,
} from './validar-reserva.util';
import type { Reserva } from '../../core/models/modelos';

const reserva = (parcial: Partial<Reserva>): Reserva =>
  ({
    id: 1,
    usuario_nombre: 'Ana',
    espacio_nombre: 'Piscina Municipal',
    usuario_id: null,
    espacio_id: null,
    fecha: '2026-03-10',
    hora_inicio: '10:00',
    hora_fin: '11:00',
    estado: 'confirmada',
    ...parcial,
  }) as Reserva;

describe('solapa', () => {
  it('detecta solapamiento parcial por ambos extremos', () => {
    expect(solapa('10:00', '11:00', '10:30', '11:30')).toBe(true);
    expect(solapa('10:30', '11:30', '10:00', '11:00')).toBe(true);
  });

  it('detecta contencion completa', () => {
    expect(solapa('10:00', '12:00', '10:30', '11:00')).toBe(true);
  });

  it('no considera solapadas dos franjas que solo se tocan', () => {
    // Criterio clave: intervalo semiabierto, igual que el backend.
    expect(solapa('10:00', '11:00', '11:00', '12:00')).toBe(false);
    expect(solapa('11:00', '12:00', '10:00', '11:00')).toBe(false);
  });

  it('no marca solapamiento con franjas separadas', () => {
    expect(solapa('10:00', '11:00', '12:00', '13:00')).toBe(false);
  });
});

describe('horasEntre', () => {
  it('calcula duraciones en horas', () => {
    expect(horasEntre('10:00', '11:30')).toBe(1.5);
    expect(horasEntre('09:15', '10:00')).toBeCloseTo(0.75);
  });

  it('devuelve 0 con formatos invalidos', () => {
    expect(horasEntre('basura', '11:00')).toBe(0);
  });
});

describe('dentroDeHorario', () => {
  it('acepta franjas dentro del horario de instalacion', () => {
    expect(dentroDeHorario('08:00', '22:00')).toBe(true);
  });

  it('rechaza franjas que se salen', () => {
    expect(dentroDeHorario('07:00', '09:00')).toBe(false);
    expect(dentroDeHorario('20:00', '23:00')).toBe(false);
  });
});

describe('formateaHoras', () => {
  it('formatea horas y minutos', () => {
    expect(formateaHoras(0)).toBe('0 h');
    expect(formateaHoras(1)).toBe('1 h');
    expect(formateaHoras(1.5)).toBe('1 h 30 min');
    expect(formateaHoras(0.5)).toBe('30 min');
  });
});

describe('validarReserva', () => {
  const contexto = {
    espacioNombre: 'Piscina Municipal',
    reservas: [reserva({ id: 7 })],
  };

  it('acepta una reserva valida sin solapamientos', () => {
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '12:00', hora_fin: '13:00' },
      contexto,
    );
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it('rechaza que la hora de fin no sea posterior a la de inicio', () => {
    // El backend NO comprueba esto: es un hueco que cubre el frontend.
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '11:00', hora_fin: '10:00' },
      contexto,
    );
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.hora_fin).toContain('posterior');
  });

  it('rechaza fechas que solo cumplen el regex pero no el calendario', () => {
    // El backend acepta 2026-02-31 porque su regex no valida el dia.
    const resultado = validarReserva(
      { fecha: '2026-02-31', hora_inicio: '09:00', hora_fin: '10:00' },
      contexto,
    );
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.fecha).toBeTruthy();
  });

  it('detecta solapamiento y devuelve las reservas en conflicto', () => {
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '10:30', hora_fin: '11:30' },
      contexto,
    );
    expect(resultado.valido).toBe(false);
    expect(resultado.solapamientos.map((r) => r.id)).toEqual([7]);
  });

  it('no cuenta como solapamiento una reserva cancelada', () => {
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '10:30', hora_fin: '11:30' },
      { ...contexto, reservas: [reserva({ id: 7, estado: 'cancelada' })] },
    );
    expect(resultado.valido).toBe(true);
  });

  it('no compara con reservas de otra instalacion', () => {
    // El vinculo es por nombre porque las lecturas no traen espacio_id.
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '10:30', hora_fin: '11:30' },
      { ...contexto, espacioNombre: 'Gimnasio Cubierto' },
    );
    expect(resultado.valido).toBe(true);
  });

  it('excluye la reserva que se esta editando', () => {
    const resultado = validarReserva(
      { fecha: '2026-03-10', hora_inicio: '10:00', hora_fin: '11:00' },
      { ...contexto, excluirId: 7 },
    );
    expect(resultado.valido).toBe(true);
  });

  it('exige los tres campos', () => {
    const resultado = validarReserva({}, contexto);
    expect(resultado.valido).toBe(false);
    expect(Object.keys(resultado.errores).sort()).toEqual(['fecha', 'hora_fin', 'hora_inicio']);
  });
});
