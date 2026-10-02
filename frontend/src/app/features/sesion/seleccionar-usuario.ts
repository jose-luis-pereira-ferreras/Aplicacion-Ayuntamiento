import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { NOMBRE_APP, NOMBRE_AYTO } from '../../core/config';
import type { Usuario } from '../../core/models/modelos';
import { coincideUsuario, iniciales } from '../../core/models/usuario.model';
import { AvisoService } from '../../core/services/aviso.service';
import { SesionService } from '../../core/services/sesion.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';

/**
 * Pantalla inicial. La API no tiene login, asi que "iniciar sesion" es elegir
 * uno de los usuarios dados de alta. El usuario elegido es ademas el al que se
 * atribuyen las nuevas reservas.
 */
@Component({
  selector: 'app-seleccionar-usuario',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    Cargando,
    ChipEstado,
    EstadoVacio,
  ],
  templateUrl: './seleccionar-usuario.html',
  styleUrl: './seleccionar-usuario.scss',
})
export class SeleccionarUsuario {
  private readonly usuariosService = inject(UsuariosService);
  private readonly aviso = inject(AvisoService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly nombreApp = NOMBRE_APP;
  protected readonly nombreAyto = NOMBRE_AYTO;

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);
  protected readonly busqueda = signal('');

  protected readonly filtrados = computed(() =>
    this.usuarios().filter((usuario) => coincideUsuario(usuario, this.busqueda())),
  );

  constructor() {
    this.cargar();
  }

  protected iniciales(nombre: string | null | undefined): string {
    return iniciales(nombre);
  }

  protected elegir(usuario: Usuario): void {
    this.sesion.establecer(usuario);
    void this.router.navigate(['/dashboard']);
  }

  protected onBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value ?? '');
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
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
