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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { filtrarDisponibles } from '../../core/models/espacio.model';
import type { Espacio, NuevaReserva, Reserva } from '../../core/models/modelos';
import { ESTADO_CONFIRMADA } from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { SesionService } from '../../core/services/sesion.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';
import { aIso } from '../../shared/utils/fecha.util';
import { iconoDeTipo } from '../../shared/utils/tipo-espacio.util';
import {
  HORA_FIN_POR_DEFECTO,
  HORA_INICIO_POR_DEFECTO,
  formateaHoras,
  horasEntre,
  validarReserva,
} from '../../shared/utils/validar-reserva.util';

@Component({
  selector: 'app-reserva-formulario',
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
  templateUrl: './reserva-formulario.html',
  styleUrl: './reserva-formulario.scss',
})
export class ReservaFormulario {
  private readonly fb = inject(FormBuilder);
  private readonly espaciosService = inject(EspaciosService);
  private readonly reservasService = inject(ReservasService);
  private readonly aviso = inject(AvisoService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  protected readonly sesion = inject(SesionService);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly errorCarga = signal<Error | null>(null);

  /** Espacios que aceptan reservas: los cerrados por mantenimiento quedan fuera. */
  protected readonly disponibles = computed(() => filtrarDisponibles(this.espacios()));

  protected readonly formulario = this.fb.nonNullable.group({
    espacio_id: this.fb.control<number | null>(null, [Validators.required]),
    fecha: this.fb.control<Date | null>(new Date(), [Validators.required]),
    hora_inicio: [HORA_INICIO_POR_DEFECTO, [Validators.required]],
    hora_fin: [HORA_FIN_POR_DEFECTO, [Validators.required]],
  });

  // Los valores del formulario son observables, no signals: los pasamos a signal
  // para que los `computed` que dependen de ellos se recalculen solos.
  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly espacioElegido = computed(
    () =>
      this.espacios().find((espacio) => espacio.id === this.formulario.controls.espacio_id.value) ??
      null,
  );

  protected readonly fechaIso = computed(() => aIso(this.valores().fecha));

  /** Revision en vivo con el mismo criterio de solapamiento que usa la API. */
  protected readonly revision = computed(() => {
    const valores = this.valores();
    const espacio = this.espacioElegido();

    if (!espacio) {
      return validarReserva({}, {});
    }

    return validarReserva(
      {
        fecha: aIso(valores.fecha),
        hora_inicio: valores.hora_inicio ?? '',
        hora_fin: valores.hora_fin ?? '',
      },
      { espacioNombre: espacio.nombre, reservas: this.reservas() },
    );
  });

  /** Franjas ya ocupadas ese mismo dia en esa instalacion. */
  protected readonly huecosDelDia = computed(() => {
    const fecha = this.fechaIso();
    const espacio = this.espacioElegido();
    if (!espacio || !fecha) {
      return [];
    }
    return this.reservas()
      .filter(
        (reserva) =>
          reserva.estado === ESTADO_CONFIRMADA &&
          reserva.fecha === fecha &&
          reserva.espacio_nombre === espacio.nombre,
      )
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  });

  protected readonly duracion = computed(() => {
    const valores = this.valores();
    return horasEntre(valores.hora_inicio ?? '', valores.hora_fin ?? '');
  });

  constructor() {
    this.seleccionarEspacioInicial();
    this.cargar();
  }

  protected iconoDeTipo(tipo: string): string {
    return iconoDeTipo(tipo);
  }

  protected formateaHoras(horas: number): string {
    return formateaHoras(horas);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.revision().valido) {
      this.aviso.info('Revisa los avisos del formulario antes de continuar.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const cuerpo: NuevaReserva = {
      usuario_id: this.sesion.usuario()!.id,
      espacio_id: Number(valores.espacio_id),
      fecha: aIso(valores.fecha),
      hora_inicio: valores.hora_inicio ?? '',
      hora_fin: valores.hora_fin ?? '',
    };

    this.guardando.set(true);

    this.reservasService.crear(cuerpo).subscribe({
      next: (reserva) => {
        this.guardando.set(false);
        this.aviso.exito('Reserva confirmada.');
        void this.router.navigate(['/reservas', reserva.id]);
      },
      error: (error: Error) => {
        this.guardando.set(false);
        this.aviso.error(error);
      },
    });
  }

  /** El espacio preseleccionado llega por query param desde el catalogo. */
  private seleccionarEspacioInicial(): void {
    const id = Number(this.ruta.snapshot.queryParamMap.get('espacio'));
    if (id) {
      this.formulario.patchValue({ espacio_id: id });
    }
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
