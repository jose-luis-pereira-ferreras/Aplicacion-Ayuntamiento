import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { Espacio, Reserva } from '../../core/models/modelos';
import {
  ESTADO_CANCELADA,
  ESTADO_CONFIRMADA,
  ESTADOS,
  ordenarPorFecha,
} from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { ConfirmarBorrado } from '../../shared/components/confirmar-borrado/confirmar-borrado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';

@Component({
  selector: 'app-reservas-listado',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './reservas-listado.html',
  styleUrl: './reservas-listado.scss',
})
export class ReservasListado {
  private readonly reservasService = inject(ReservasService);
  private readonly espaciosService = inject(EspaciosService);
  private readonly aviso = inject(AvisoService);
  private readonly dialog = inject(MatDialog);

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);
  protected readonly cambiando = signal<number | null>(null);
  protected readonly busqueda = signal('');
  protected readonly estadoActivo = signal('');
  protected readonly espacioActivo = signal('');

  protected readonly estados = ESTADOS;
  protected readonly columnas = ['fecha', 'franja', 'espacio', 'usuario', 'estado', 'acciones'];
  protected readonly total = computed(() => this.reservas().length);

  protected readonly nombresEspacios = computed(() => {
    const nombres: string[] = this.espacios().map((espacio) => espacio.nombre);
    // Incluye los nombres que solo aparecen en reservas por si el catalogo cambia.
    for (const reserva of this.reservas()) {
      if (reserva.espacio_nombre && !nombres.includes(reserva.espacio_nombre)) {
        nombres.push(reserva.espacio_nombre);
      }
    }
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
  });

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.estadoActivo();
    const espacio = this.espacioActivo();

    return ordenarPorFecha(this.reservas())
      .reverse()
      .filter((reserva) => {
        if (estado && reserva.estado !== estado) return false;
        if (espacio && reserva.espacio_nombre !== espacio) return false;
        if (!texto) return true;
        return [reserva.espacio_nombre, reserva.usuario_nombre].some((campo) =>
          (campo ?? '').toLowerCase().includes(texto),
        );
      });
  });

  constructor() {
    this.cargar();
  }

  protected onBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value ?? '');
  }

  protected onFiltrarEstado(estado: string): void {
    this.estadoActivo.set(this.estadoActivo() === estado ? '' : estado);
  }

  protected onFiltrarEspacio(nombre: string): void {
    this.espacioActivo.set(this.espacioActivo() === nombre ? '' : nombre);
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estadoActivo.set('');
    this.espacioActivo.set('');
  }

  protected hayFiltros(): boolean {
    return Boolean(this.busqueda() || this.estadoActivo() || this.espacioActivo());
  }

  /** Cancelar es directo; reactivar avisa, porque la API no revalida solapamientos. */
  protected cambiarEstado(reserva: Reserva): void {
    const objetivo = reserva.estado === ESTADO_CONFIRMADA ? ESTADO_CANCELADA : ESTADO_CONFIRMADA;

    if (objetivo === ESTADO_CANCELADA) {
      this.aplicarEstado(reserva, objetivo);
      return;
    }

    ConfirmarBorrado.abrir(this.dialog, {
      titulo: 'Reactivar reserva',
      mensaje: `La reserva del ${reserva.fecha} de ${reserva.espacio_nombre} volverá a confirmada.`,
      advertencia:
        'La API no vuelve a comprobar solapamientos al reactivar: si otra reserva ocupa ahora ese hueco, quedará solapada.',
      aceptar: 'Reactivar',
    }).subscribe({
      next: (confirmado) => {
        if (confirmado) {
          this.aplicarEstado(reserva, objetivo);
        }
      },
      error: () => undefined,
    });
  }

  protected eliminar(reserva: Reserva): void {
    ConfirmarBorrado.abrir(this.dialog, {
      titulo: 'Eliminar reserva',
      mensaje: `Se eliminará la reserva del ${reserva.fecha}, de ${reserva.hora_inicio} a ${reserva.hora_fin}, en ${reserva.espacio_nombre}.`,
      advertencia: 'Si solo querías liberar el hueco, cancelarla es mejor opción.',
      aceptar: 'Eliminar',
    }).subscribe({
      next: (confirmado) => {
        if (!confirmado) {
          return;
        }

        this.reservasService.eliminar(reserva.id).subscribe({
          next: () => {
            this.aviso.exito('Reserva eliminada.');
            this.cargar();
          },
          error: (error: Error) => this.aviso.error(error),
        });
      },
      error: () => undefined,
    });
  }

  private aplicarEstado(reserva: Reserva, estado: string): void {
    this.cambiando.set(reserva.id);

    this.reservasService.cambiarEstado(reserva.id, estado).subscribe({
      next: (actualizada) => {
        this.cambiando.set(null);
        this.reservas.update((lista) =>
          lista.map((item) => (item.id === actualizada.id ? actualizada : item)),
        );
        this.aviso.exito(
          estado === ESTADO_CANCELADA ? 'Reserva cancelada.' : 'Reserva confirmada.',
        );
      },
      error: (error: Error) => {
        this.cambiando.set(null);
        this.aviso.error(error);
      },
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      reservas: this.reservasService.listar(),
      espacios: this.espaciosService.listar(),
    }).subscribe({
      next: ({ reservas, espacios }) => {
        this.reservas.set(reservas);
        this.espacios.set(espacios);
        this.cargando.set(false);
      },
      error: (error: Error) => {
        this.errorCarga.set(error);
        this.cargando.set(false);
        this.aviso.error(error);
      },
    });
  }
}
