import { ROL_ADMIN, ROL_CIUDADANO } from '../config';
import type { Usuario } from './modelos';

export function crearUsuario(datos: Partial<Usuario>): Usuario {
  return {
    id: datos.id as number,
    nombre: datos.nombre ?? '',
    email: datos.email ?? '',
    rol: datos.rol || ROL_CIUDADANO,
  };
}

export const OPCIONES_ROL: { valor: string; etiqueta: string }[] = [
  { valor: ROL_CIUDADANO, etiqueta: 'Ciudadano' },
  { valor: ROL_ADMIN, etiqueta: 'Administrador' },
];

export function etiquetaRol(rol: string): string {
  return OPCIONES_ROL.find((opcion) => opcion.valor === rol)?.etiqueta ?? rol;
}

export function iniciales(nombre: string | null | undefined): string {
  return (nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export function coincideUsuario(usuario: Usuario, texto: string): boolean {
  if (!texto) {
    return true;
  }
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) {
    return true;
  }
  return [usuario.nombre, usuario.email, usuario.rol].some((campo) =>
    campo.toLowerCase().includes(busqueda),
  );
}
