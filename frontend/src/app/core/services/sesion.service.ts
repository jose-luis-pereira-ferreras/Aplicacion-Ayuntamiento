import { Injectable, signal } from '@angular/core';
import { ROL_ADMIN } from '../config';
import type { Usuario } from '../models/modelos';
import { crearUsuario } from '../models/usuario.model';

const CLAVE = 'ayto-deportes:usuario';

/**
 * Sesion simulada. La API no tiene login ni emision de tokens, asi que la
 * "sesion" es solo el usuario que se ha elegido en la pantalla inicial y se
 * guarda en localStorage. La API sigue aceptando cualquier usuario_id: esto
 * da coherencia al flujo, no seguridad.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly usuario = signal<Usuario | null>(null);

  constructor() {
    this.usuario.set(this.leer());
  }

  get activo(): boolean {
    return Boolean(this.usuario());
  }

  esAdmin(): boolean {
    return this.usuario()?.rol === ROL_ADMIN;
  }

  establecer(usuario: Partial<Usuario>): Usuario {
    const limpio = crearUsuario(usuario);
    this.usuario.set(limpio);
    this.guardar(limpio);
    return limpio;
  }

  /** Se llama cuando el usuario guardado ya no existe en la API. */
  cerrar(): void {
    this.usuario.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* almacenamiento no disponible: la sesion vive solo en memoria */
    }
  }

  private leer(): Usuario | null {
    try {
      const guardado = localStorage.getItem(CLAVE);
      return guardado ? crearUsuario(JSON.parse(guardado)) : null;
    } catch {
      return null;
    }
  }

  private guardar(usuario: Usuario): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(usuario));
    } catch {
      /* idem */
    }
  }
}
