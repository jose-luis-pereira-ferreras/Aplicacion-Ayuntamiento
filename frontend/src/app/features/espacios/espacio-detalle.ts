import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, type OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { Espacio, Reserva } from '../../core/models/modelos';
import { ESTADO_CONFIRMADA, deEspacio, ordenarPorFecha } from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { formateaHoras, horasEntre } from '../../shared/utils/validar-reserva.util';
import { hoyIso } from '../../shared/utils/fecha.util';
import { gradienteDeTipo, iconoDeTipo } from '../../shared/utils/tipo-espacio.util';

@Component({
  selector: 'app-espacio-detalle',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
  ],
  templateUrl: './espacio-detalle.html',
  styleUrl: './espacio-detalle.scss',
})
export class EspacioDetalle implements OnInit {
  private readonly espaciosService = inject(EspaciosService);
  private readonly reservasService = inject(ReservasService);
  private readonly aviso = inject(AvisoService);

  /** Enlazado desde la ruta con withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly espacio = signal<Espacio | null>(null);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);

  protected readonly columnas = ['fecha', 'franja', 'usuario', 'estado'];

  protected readonly reservasEspacio = computed(() => {
    const espacio = this.espacio();
    if (!espacio) {
      return [];
    }
    return ordenarPorFecha(deEspacio(this.reservas(), espacio.nombre)).reverse();
  });

  protected readonly proximas = computed(() =>
    this.reservasEspacio().filter(
      (reserva) => reserva.estado === ESTADO_CONFIRMADA && reserva.fecha >= hoyIso(),
    ),
  );

  protected readonly horasTotales = computed(() =>
    formateaHoras(
      this.reservas()
        .filter(
          (r) => r.estado === ESTADO_CONFIRMADA && r.espacio_nombre === this.espacio()?.nombre,
        )
        .reduce((total, r) => total + horasEntre(r.hora_inicio, r.hora_fin), 0),
    ),
  );

  /**
   * El id llega por input de ruta, que no esta disponible en el constructor:
   * hay que esperar a ngOnInit para leerlo.
   */
  ngOnInit(): void {
    this.cargar();
  }

  protected icono(): string {
    return iconoDeTipo(this.espacio()?.tipo);
  }

  protected gradiente(): string {
    return gradienteDeTipo(this.espacio()?.tipo);
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      espacio: this.espaciosService.obtener(this.id()),
      reservas: this.reservasService.listar(),
    }).subscribe({
      next: ({ espacio, reservas }) => {
        this.espacio.set(espacio);
        this.reservas.set(reservas);
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
