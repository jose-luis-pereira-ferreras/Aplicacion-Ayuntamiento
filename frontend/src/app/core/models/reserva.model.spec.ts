import { describe, expect, it } from 'vitest';
import {
  crearReserva,
  deEspacio,
  esDeEspacio,
  estaConfirmada,
  etiquetaEstado,
  ordenarPorFecha,
} from './reserva.model';

/**
 * La API responde con dos formas distintas segun el verbo. Estos tests fijan
 * el comportamiento de `crearReserva` para que la normalizacion no se rompa.
 */
describe('crearReserva', () => {
  it('normaliza la forma de lectura (GET: nombres y sin ids)', () => {
    const reserva = crearReserva({
      id: 3,
      usuario_nombre: 'Ana García',
      espacio_nombre: 'Piscina Municipal',
      fecha: '2024-10-15',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      estado: 'confirmada',
    });

    expect(reserva).toEqual({
      id: 3,
      usuario_nombre: 'Ana García',
      espacio_nombre: 'Piscina Municipal',
      usuario_id: null,
      espacio_id: null,
      fecha: '2024-10-15',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      estado: 'confirmada',
    });
  });

  it('normaliza la forma de escritura (POST/PUT: ids y sin nombres)', () => {
    const reserva = crearReserva({
      id: 4,
      usuario_id: 2,
      espacio_id: 1,
      fecha: '2024-10-16',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      estado: 'confirmada',
    });

    expect(reserva.usuario_id).toBe(2);
    expect(reserva.espacio_id).toBe(1);
    // Los nombres no vienen: quedan a null, nunca a string vacío.
    expect(reserva.usuario_nombre).toBeNull();
    expect(reserva.espacio_nombre).toBeNull();
  });

  it('rellena con "confirmada" cuando el backend no manda estado', () => {
    expect(crearReserva({ id: 1 }).estado).toBe('confirmada');
  });

  it('tolera una fila vacia sin lanzar', () => {
    expect(() => crearReserva({})).not.toThrow();
  });
});

describe('estaConfirmada', () => {
  it('distingue confirmada de cancelada', () => {
    expect(estaConfirmada(crearReserva({ estado: 'confirmada' }))).toBe(true);
    expect(estaConfirmada(crearReserva({ estado: 'cancelada' }))).toBe(false);
  });
});

describe('esDeEspacio / deEspacio', () => {
  const reservas = [
    crearReserva({
      id: 1,
      espacio_nombre: 'Piscina Municipal',
      fecha: '2024-10-15',
      hora_inicio: '10:00',
    }),
    crearReserva({
      id: 2,
      espacio_nombre: 'Gimnasio Cubierto',
      fecha: '2024-10-15',
      hora_inicio: '09:00',
    }),
    crearReserva({
      id: 3,
      espacio_nombre: 'Piscina Municipal',
      fecha: '2024-10-16',
      hora_inicio: '11:00',
    }),
  ];

  it('compara por nombre, porque las lecturas no traen espacio_id', () => {
    expect(esDeEspacio(reservas[0], 'Piscina Municipal')).toBe(true);
    expect(esDeEspacio(reservas[0], 'Gimnasio Cubierto')).toBe(false);
  });

  it('filtra todas las reservas de una instalacion', () => {
    expect(deEspacio(reservas, 'Piscina Municipal').map((r) => r.id)).toEqual([1, 3]);
  });
});

describe('ordenarPorFecha', () => {
  it('ordena por fecha y luego por hora de inicio, sin mutar el original', () => {
    const original = [
      crearReserva({ id: 1, fecha: '2024-10-16', hora_inicio: '09:00' }),
      crearReserva({ id: 2, fecha: '2024-10-15', hora_inicio: '18:00' }),
      crearReserva({ id: 3, fecha: '2024-10-15', hora_inicio: '10:00' }),
    ];
    const copia = [...original];

    const ordenados = ordenarPorFecha(original);

    expect(ordenados.map((r) => r.id)).toEqual([3, 2, 1]);
    expect(original).toEqual(copia);
  });
});

describe('etiquetaEstado', () => {
  it('traduce los estados conocidos y deja los desconocidos tal cual', () => {
    expect(etiquetaEstado('confirmada')).toBe('Confirmada');
    expect(etiquetaEstado('cancelada')).toBe('Cancelada');
    expect(etiquetaEstado('raro')).toBe('raro');
  });
});
