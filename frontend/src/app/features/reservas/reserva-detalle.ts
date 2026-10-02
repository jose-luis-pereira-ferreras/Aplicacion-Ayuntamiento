import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, type OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import type { Espacio, Reserva } from '../../core/models/modelos';
import { ESTADO_CANCELADA, ESTADO_CONFIRMADA } from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { ConfirmarBorrado } from '../../shared/components/confirmar-borrado/confirmar-borrado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';
import { fechaLarga } from '../../shared/utils/fecha.util';
import { formateaHoras, horasEntre } from '../../shared/utils/validar-reserva.util';
import { iconoDeTipo } from '../../shared/utils/tipo-espacio.util';

@Component({
  selector: 'app-reserva-detalle',
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './reserva-detalle.html',
  styleUrl: './reserva-detalle.scss',
})
export class ReservaDetalle implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly espaciosService = inject(EspaciosService);
  private readonly aviso = inject(AvisoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  /** Enlazado desde la ruta con withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly reserva = signal<Reserva | null>(null);
  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly cambiando = signal(false);
  protected readonly errorCarga = signal<Error | null>(null);

  /**
   * Las lecturas de la reserva traen `espacio_nombre` pero no `espacio_id`, asi
   * que el vinculo con el catalogo se hace por nombre.
   */
  protected readonly espacio = computed(
    () => this.espacios().find((item) => item.nombre === this.reserva()?.espacio_nombre) ?? null,
  );

  protected readonly duracion = computed(() => {
    const reserva = this.reserva();
    return reserva ? formateaHoras(horasEntre(reserva.hora_inicio, reserva.hora_fin)) : '';
  });

  /** El id de ruta no esta disponible en el constructor. */
  ngOnInit(): void {
    this.cargar();
  }

  protected fechaLarga(iso: string): string {
    return fechaLarga(iso);
  }

  protected iconoEspacio(): string {
    return iconoDeTipo(this.espacio()?.tipo ?? this.reserva()?.espacio_nombre);
  }

  protected cambiarEstado(): void {
    const reserva = this.reserva()!;
    const objetivo = reserva.estado === ESTADO_CONFIRMADA ? ESTADO_CANCELADA : ESTADO_CONFIRMADA;

    if (objetivo === ESTADO_CANCELADA) {
      this.aplicarEstado(objetivo);
      return;
    }

    ConfirmarBorrado.abrir(this.dialog, {
      titulo: 'Reactivar reserva',
      mensaje: `La reserva volverá a estar confirmada.`,
      advertencia:
        'La API no vuelve a comprobar solapamientos al reactivar, así que asegúrate de que el hueco sigue libre.',
      aceptar: 'Reactivar',
    }).subscribe({
      next: (ok) => {
        if (ok) {
          this.aplicarEstado(objetivo);
        }
      },
      error: () => undefined,
    });
  }

  protected eliminar(): void {
    const reserva = this.reserva()!;

    ConfirmarBorrado.abrir(this.dialog, {
      titulo: 'Eliminar reserva',
      mensaje: `Se eliminará la reserva del ${reserva.fecha} en ${reserva.espacio_nombre}.`,
      advertencia: 'Cancelar la reserva también libera el horario y conserva el registro.',
      aceptar: 'Eliminar',
    }).subscribe({
      next: (confirmado) => {
        if (!confirmado) {
          return;
        }

        this.reservasService.eliminar(reserva.id).subscribe({
          next: () => {
            this.aviso.exito('Reserva eliminada.');
            void this.router.navigate(['/reservas']);
          },
          error: (error: Error) => this.aviso.error(error),
        });
      },
      error: () => undefined,
    });
  }

  private aplicarEstado(estado: string): void {
    this.cambiando.set(true);

    this.reservasService.cambiarEstado(this.reserva()!.id, estado).subscribe({
      next: (actualizada) => {
        this.reserva.set(actualizada);
        this.cambiando.set(false);
        this.aviso.exito(
          estado === ESTADO_CANCELADA ? 'Reserva cancelada.' : 'Reserva confirmada.',
        );
      },
      error: (error: Error) => {
        this.cambiando.set(false);
        this.aviso.error(error);
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.reservasService.obtener(this.id()).subscribe({
      next: (reserva) => {
        this.reserva.set(reserva);
        this.cargando.set(false);
        // El espacio solo se usa para el icono y el tipo: si falla, no bloquea.
        this.espaciosService.listar().subscribe({
          next: (espacios) => this.espacios.set(espacios),
          error: () => this.espacios.set([]),
        });
      },
      error: (error: Error) => {
        this.errorCarga.set(error);
        this.cargando.set(false);
        this.aviso.error(error);
      },
    });
  }
}
