import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import {
  coincideEspacio,
  filtrarDisponibles,
  tiposDistintos,
} from '../../core/models/espacio.model';
import type { Espacio } from '../../core/models/modelos';
import { AvisoService } from '../../core/services/aviso.service';
import { EspaciosService } from '../../core/services/espacios.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';
import { gradienteDeTipo, iconoDeTipo } from '../../shared/utils/tipo-espacio.util';

/** Catalogo de instalaciones. Solo lectura: la API no expone escritura de espacios. */
@Component({
  selector: 'app-espacios-listado',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './espacios-listado.html',
  styleUrl: './espacios-listado.scss',
})
export class EspaciosListado {
  private readonly espaciosService = inject(EspaciosService);
  private readonly aviso = inject(AvisoService);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);
  protected readonly busqueda = signal('');
  protected readonly tipoActivo = signal('');

  protected readonly tipos = computed(() => tiposDistintos(this.espacios()));

  protected readonly filtrados = computed(() => {
    const tipo = this.tipoActivo();
    return this.espacios().filter(
      (espacio) => coincideEspacio(espacio, this.busqueda()) && (!tipo || espacio.tipo === tipo),
    );
  });

  protected readonly disponibles = computed(() => filtrarDisponibles(this.espacios()).length);

  constructor() {
    this.cargar();
  }

  protected icono(espacio: Espacio): string {
    return iconoDeTipo(espacio.tipo);
  }

  protected gradiente(espacio: Espacio): string {
    return gradienteDeTipo(espacio.tipo);
  }

  protected onBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value ?? '');
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.espaciosService.listar().subscribe({
      next: (espacios) => {
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
