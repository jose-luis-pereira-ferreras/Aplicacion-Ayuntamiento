import { inject, Injectable } from '@angular/core';
import { catchError, map, of, switchMap, type Observable } from 'rxjs';
import type { NuevaReserva, Reserva } from '../models/modelos';
import { crearReserva } from '../models/reserva.model';
import { ApiService } from './api.service';

/**
 * La API devuelve formas distintas segun el verbo:
 *   GET       -> { id, usuario_nombre, espacio_nombre, fecha, ... }
 *   POST/PUT  -> { id, usuario_id, espacio_id, fecha, ... }
 *
 * Para que el resto de la aplicacion solo conozca la forma con nombres, tras
 * cada escritura volvemos a pedir la reserva por id. Si esa segunda llamada
 * fallara, caemos a la fila cruda en lugar de perder la operacion.
 */
@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly api = inject(ApiService);

  listar(): Observable<Reserva[]> {
    return this.api
      .listar<Partial<Reserva>>('reservas')
      .pipe(map((lista) => lista.map(crearReserva)));
  }

  obtener(id: number | string): Observable<Reserva> {
    return this.api.obtener<Partial<Reserva>>('reservas', id).pipe(map(crearReserva));
  }

  /**
   * `estado` no se acepta en la creacion: el backend lo fija a 'confirmada'.
   */
  crear(datos: NuevaReserva): Observable<Reserva> {
    return this.api
      .crear<Partial<Reserva>, NuevaReserva>('reservas', datos)
      .pipe(switchMap((creada) => this.releer(creada)));
  }

  /**
   * El PUT solo admite `estado`; cualquier otro campo del cuerpo se ignora.
   * No revalida solapamientos, por eso al reactivar una cancelada conviene
   * comprobar el hueco antes en el formulario.
   */
  cambiarEstado(id: number | string, estado: string): Observable<Reserva> {
    return this.api
      .actualizar<Partial<Reserva>, { estado: string }>('reservas', id, { estado })
      .pipe(switchMap((actualizada) => this.releer(actualizada)));
  }

  eliminar(id: number | string): Observable<void> {
    return this.api.eliminar('reservas', id);
  }

  /** Vuelve a pedir la reserva ya escrita para obtener la forma con nombres. */
  private releer(fila: Partial<Reserva>): Observable<Reserva> {
    return this.api.obtener<Partial<Reserva>>('reservas', fila.id as number).pipe(
      map(crearReserva),
      catchError(() => of(crearReserva(fila))),
    );
  }
}
