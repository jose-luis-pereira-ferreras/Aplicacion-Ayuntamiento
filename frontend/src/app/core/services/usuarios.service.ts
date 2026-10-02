import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { CambiosUsuario, NuevoUsuario, Usuario } from '../models/modelos';
import { crearUsuario } from '../models/usuario.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly api = inject(ApiService);

  listar(): Observable<Usuario[]> {
    return this.api
      .listar<Partial<Usuario>>('usuarios')
      .pipe(map((lista) => lista.map(crearUsuario)));
  }

  obtener(id: number | string): Observable<Usuario> {
    return this.api.obtener<Partial<Usuario>>('usuarios', id).pipe(map(crearUsuario));
  }

  crear(datos: Partial<NuevoUsuario>): Observable<Usuario> {
    return this.api
      .crear<Partial<Usuario>, Partial<NuevoUsuario>>('usuarios', datos)
      .pipe(map(crearUsuario));
  }

  /**
   * El backend resuelve los campos ausentes con `||`, asi que una cadena
   * vacia se ignora silenciosamente. Por eso el formulario debe enviar solo
   * los campos que han cambiado de verdad.
   */
  actualizar(id: number | string, cambios: CambiosUsuario): Observable<Usuario> {
    return this.api
      .actualizar<Partial<Usuario>, CambiosUsuario>('usuarios', id, cambios)
      .pipe(map(crearUsuario));
  }

  eliminar(id: number | string): Observable<void> {
    return this.api.eliminar('usuarios', id);
  }
}
