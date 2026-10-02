import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config';

/**
 * Envoltura generica del CRUD de la API. Todas las URLs son relativas para
 * que salgan por el proxy de desarrollo (proxy.conf.json) y nunca por CORS.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private url(recurso: string): string {
    return `${API_BASE}/${recurso}`;
  }

  listar<T>(recurso: string): Observable<T[]> {
    return this.http.get<T[]>(this.url(recurso));
  }

  obtener<T>(recurso: string, id: number | string): Observable<T> {
    return this.http.get<T>(this.url(`${recurso}/${id}`));
  }

  crear<T, D>(recurso: string, datos: D): Observable<T> {
    return this.http.post<T>(this.url(recurso), datos);
  }

  actualizar<T, D>(recurso: string, id: number | string, datos: D): Observable<T> {
    return this.http.put<T>(this.url(`${recurso}/${id}`), datos);
  }

  eliminar(recurso: string, id: number | string): Observable<void> {
    return this.http.delete<void>(this.url(`${recurso}/${id}`));
  }

  /** Ping de salud: la raiz del servidor responde { mensaje }. */
  salud(): Observable<{ mensaje: string }> {
    return this.http.get<{ mensaje: string }>(API_BASE.replace(/\/api$/, ''));
  }
}
