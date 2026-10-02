import type { Espacio } from './modelos';

type Crudo = Partial<Espacio> & Record<string, unknown>;

export function crearEspacio(datos: Crudo): Espacio {
  return {
    id: datos.id as number,
    nombre: (datos.nombre as string) ?? '',
    tipo: (datos.tipo as string) ?? '',
    ubicacion: (datos.ubicacion as string) ?? '',
    capacidad_maxima: Number(datos.capacidad_maxima) || 0,
    disponible: datos.disponible ? 1 : 0,
  };
}

export const estaDisponible = (espacio: Espacio | null): boolean => Boolean(espacio?.disponible);

export const filtrarDisponibles = (espacios: Espacio[]): Espacio[] =>
  espacios.filter(estaDisponible);

/** Tipos distintos presentes en el listado, para los desplegables de filtro. */
export function tiposDistintos(espacios: Espacio[]): string[] {
  return [...new Set(espacios.map((e) => e.tipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

/** Texto que se busca en el listado de espacios. */
export function coincideEspacio(espacio: Espacio, texto: string): boolean {
  if (!texto) {
    return true;
  }
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) {
    return true;
  }
  return [espacio.nombre, espacio.tipo, espacio.ubicacion].some((campo) =>
    campo.toLowerCase().includes(busqueda),
  );
}
