import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { Espacio, Reserva } from '../../core/models/modelos';
import { ESTADO_CONFIRMADA } from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';
import { aIso, hoyIso } from '../../shared/utils/fecha.util';
import {
  HORA_APERTURA,
  HORA_CIERRE,
  formateaHoras,
  horasEntre,
} from '../../shared/utils/validar-reserva.util';

interface Franja {
  hora: string;
  huecos: Reserva[];
}

@Component({
  selector: 'app-reservas-agenda',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    Cargando,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './reservas-agenda.html',
  styleUrl: './reservas-agenda.scss',
})
export class ReservasAgenda {
  private readonly fb = inject(FormBuilder);
  private readonly espaciosService = inject(EspaciosService);
  private readonly reservasService = inject(ReservasService);
  private readonly aviso = inject(AvisoService);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);
  protected readonly reservaSeleccionada = signal<Reserva | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    espacio_id: this.fb.control<number | null>(null, [Validators.required]),
    fecha: this.fb.control<Date | null>(new Date(), [Validators.required]),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly espacioElegido = computed(
    () =>
      this.espacios().find((espacio) => espacio.id === this.formulario.controls.espacio_id.value) ??
      null,
  );

  protected readonly fechaIso = computed(() => aIso(this.valores().fecha));

  protected readonly reservasDelDia = computed(() => {
    const fecha = this.fechaIso();
    const espacio = this.espacioElegido();
    if (!espacio || !fecha) {
      return [];
    }
    return this.reservas()
      .filter((reserva) => reserva.fecha === fecha && reserva.espacio_nombre === espacio.nombre)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  });

  protected readonly confirmadasDelDia = computed(() =>
    this.reservasDelDia().filter((reserva) => reserva.estado === ESTADO_CONFIRMADA),
  );

  protected readonly horasOcupadas = computed(() =>
    formateaHoras(
      this.confirmadasDelDia().reduce(
        (total, reserva) => total + horasEntre(reserva.hora_inicio, reserva.hora_fin),
        0,
      ),
    ),
  );

  /**
   * Una fila por hora de apertura. Cada reserva se muestra solo en la fila de
   * su hora de inicio, para no repetirla en todas las horas que cruza.
   */
  protected readonly franjas = computed<Franja[]>(() => {
    const reservas = this.reservasDelDia();

    return Array.from({ length: HORA_CIERRE - HORA_APERTURA }, (_, indice) => {
      const hora = `${String(HORA_APERTURA + indice).padStart(2, '0')}:00`;
      return {
        hora,
        huecos: reservas.filter((reserva) => reserva.hora_inicio.slice(0, 2) === hora.slice(0, 2)),
      };
    });
  });

  constructor() {
    const espacio = Number(this.ruta.snapshot.queryParamMap.get('espacio'));
    if (espacio) {
      this.formulario.patchValue({ espacio_id: espacio });
    }
    this.cargar();
  }

  protected irADia(offset: number): void {
    const actual = aIso(this.formulario.controls.fecha.value) || hoyIso();
    const fecha = new Date(actual);
    fecha.setDate(fecha.getDate() + offset);
    this.formulario.patchValue({ fecha });
  }

  protected irAHoy(): void {
    this.formulario.patchValue({ fecha: new Date() });
  }

  protected seleccionar(reserva: Reserva): void {
    this.reservaSeleccionada.set(reserva);
  }

  protected cerrarSeleccion(): void {
    this.reservaSeleccionada.set(null);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      espacios: this.espaciosService.listar(),
      reservas: this.reservasService.listar(),
    }).subscribe({
      next: ({ espacios, reservas }) => {
        this.espacios.set(espacios);
        this.reservas.set(reservas);

        // Si no veio nada por query param, elegimos el primero disponible.
        if (!this.formulario.controls.espacio_id.value && espacios.length) {
          const primero = espacios.find((espacio) => espacio.disponible) ?? espacios[0];
          this.formulario.patchValue({ espacio_id: primero.id });
        }

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
