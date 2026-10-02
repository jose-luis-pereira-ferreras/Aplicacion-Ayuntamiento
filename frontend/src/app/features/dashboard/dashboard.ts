import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ROL_ADMIN } from '../../core/config';
import type { Espacio, Reserva, Usuario } from '../../core/models/modelos';
import {
  ESTADO_CANCELADA,
  ESTADO_CONFIRMADA,
  ordenarPorFecha,
} from '../../core/models/reserva.model';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { ReservasService } from '../../core/services/reservas.service';
import { SesionService } from '../../core/services/sesion.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';
import {
  DIAS_HABILES_POR_DEFECTO,
  formateaHoras,
  horasEntre,
} from '../../shared/utils/validar-reserva.util';
import { fechaCorta, hoyIso } from '../../shared/utils/fecha.util';

interface Kpi {
  icono: string;
  etiqueta: string;
  valor: string | number;
  detalle: string;
  color: 'primary' | 'tertiary';
}

interface OcupacionEspacio {
  espacio: Espacio;
  horas: number;
  porcentaje: number;
  etiqueta: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly espaciosService = inject(EspaciosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly reservasService = inject(ReservasService);
  private readonly aviso = inject(AvisoService);
  protected readonly sesion = inject(SesionService);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);

  protected readonly hoy = hoyIso();

  protected readonly kpis = computed<Kpi[]>(() => {
    const espacios = this.espacios();
    const reservas = this.reservas();
    const confirmados = reservas.filter((r) => r.estado === ESTADO_CONFIRMADA);
    const canceladas = reservas.filter((r) => r.estado === ESTADO_CANCELADA);
    const abiertos = espacios.filter((e) => e.disponible);

    const horasOcupadas = confirmados.reduce(
      (total, r) => total + horasEntre(r.hora_inicio, r.hora_fin),
      0,
    );
    const capacidadTotal = espacios.length * DIAS_HABILES_POR_DEFECTO;
    const ocupacion = capacidadTotal
      ? Math.min(100, Math.round((horasOcupadas / capacidadTotal) * 100))
      : 0;

    return [
      {
        icono: 'sports_basketball',
        etiqueta: 'Instalaciones',
        valor: espacios.length,
        detalle: `${abiertos.length} disponibles`,
        color: 'primary',
      },
      {
        icono: 'event_available',
        etiqueta: 'Reservas confirmadas',
        valor: confirmados.length,
        detalle: `${canceladas.length} canceladas`,
        color: 'tertiary',
      },
      {
        icono: 'group',
        etiqueta: 'Usuarios registrados',
        valor: this.usuarios().length,
        detalle: `${this.usuarios().filter((u) => u.rol === ROL_ADMIN).length} administradores`,
        color: 'primary',
      },
      {
        icono: 'donut_large',
        etiqueta: 'Ocupación estimada',
        valor: `${ocupacion} %`,
        detalle: `${formateaHoras(horasOcupadas)} reservadas`,
        color: 'tertiary',
      },
    ];
  });

  /** Proximas reservas confirmadas a partir de hoy, las 6 primeras. */
  protected readonly proximas = computed(() =>
    ordenarPorFecha(
      this.reservas().filter(
        (reserva) => reserva.estado === ESTADO_CONFIRMADA && reserva.fecha >= this.hoy,
      ),
    ).slice(0, 6),
  );

  /** Horas confirmadas por instalacion, para el grafico de barras. */
  protected readonly ocupacionEspacios = computed<OcupacionEspacio[]>(() => {
    const reservas = this.reservas().filter((r) => r.estado === ESTADO_CONFIRMADA);
    const porEspacio = this.espacios().map((espacio) => {
      const horas = reservas
        .filter((r) => r.espacio_nombre === espacio.nombre)
        .reduce((total, r) => total + horasEntre(r.hora_inicio, r.hora_fin), 0);
      return { espacio, horas };
    });

    const maximo = Math.max(1, ...porEspacio.map((item) => item.horas));
    return porEspacio.map((item) => ({
      ...item,
      porcentaje: Math.round((item.horas / maximo) * 100),
      etiqueta: `${formateaHoras(item.horas)}${item.espacio.disponible ? '' : ' · cerrado'}`,
    }));
  });

  protected readonly misReservas = computed(() => {
    const nombre = this.sesion.usuario()?.nombre ?? '';
    return ordenarPorFecha(
      this.reservas().filter(
        (reserva) =>
          reserva.estado === ESTADO_CONFIRMADA &&
          reserva.fecha >= this.hoy &&
          (reserva.usuario_nombre ?? '') === nombre,
      ),
    ).slice(0, 4);
  });

  constructor() {
    this.cargar();
  }

  protected fechaCorta(iso: string): string {
    return fechaCorta(iso);
  }

  protected formateaHoras(horas: number): string {
    return formateaHoras(horas);
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      espacios: this.espaciosService.listar(),
      usuarios: this.usuariosService.listar(),
      reservas: this.reservasService.listar(),
    }).subscribe({
      next: ({ espacios, usuarios, reservas }) => {
        this.espacios.set(espacios);
        this.usuarios.set(usuarios);
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
