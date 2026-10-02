import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { Espacio } from '../models/modelos';
import { crearEspacio } from '../models/espacio.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EspaciosService {
  private readonly api = inject(ApiService);

  listar(): Observable<Espacio[]> {
    return this.api
      .listar<Partial<Espacio>>('espacios')
      .pipe(map((lista) => lista.map(crearEspacio)));
  }

  obtener(id: number | string): Observable<Espacio> {
    return this.api.obtener<Partial<Espacio>>('espacios', id).pipe(map(crearEspacio));
  }
}
