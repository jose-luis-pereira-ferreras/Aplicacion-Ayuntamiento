/**
 * Tipos del dominio. Reflejan exactamente lo que devuelve la API.
 *
 * `Reserva` documenta la asimetría del backend: en lecturas llegan nombres y
 * no ids, en escrituras ids y no nombres. El servicio normaliza siempre a la
 * forma de lectura, y los ids quedan como opcionales precisamente por eso.
 */

/** `disponible` llega como entero 0 | 1 desde SQLite, no como booleano. */
export interface Espacio {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  capacidad_maxima: number;
  disponible: 0 | 1;
}

export type NuevoEspacio = Omit<Espacio, 'id'>;

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

/** El backend nunca devuelve `password`: solo se acepta al crear o editar. */
export interface NuevoUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export type CambiosUsuario = Partial<NuevoUsuario>;

export interface Reserva {
  id: number;
  usuario_nombre: string | null;
  espacio_nombre: string | null;
  /** Solo presentes cuando la respuesta viene de un POST o un PUT. */
  usuario_id: number | null;
  espacio_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

/** Cuerpo del POST /api/reservas: el estado no se envía, lo fija el backend. */
export interface NuevaReserva {
  usuario_id: number;
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}
