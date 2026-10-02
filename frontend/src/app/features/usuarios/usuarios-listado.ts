import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ROL_ADMIN } from '../../core/config';
import type { Usuario } from '../../core/models/modelos';
import { OPCIONES_ROL, coincideUsuario, iniciales } from '../../core/models/usuario.model';
import { AvisoService } from '../../core/services/aviso.service';
import { SesionService } from '../../core/services/sesion.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { ChipEstado } from '../../shared/components/chip-estado/chip-estado';
import { ConfirmarBorrado } from '../../shared/components/confirmar-borrado/confirmar-borrado';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';

@Component({
  selector: 'app-usuarios-listado',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    Cargando,
    ChipEstado,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './usuarios-listado.html',
  styleUrl: './usuarios-listado.scss',
})
export class UsuariosListado {
  private readonly usuariosService = inject(UsuariosService);
  private readonly aviso = inject(AvisoService);
  private readonly dialog = inject(MatDialog);
  protected readonly sesion = inject(SesionService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<Error | null>(null);
  protected readonly busqueda = signal('');
  protected readonly rolActivo = signal('');
  protected readonly guardando = signal(false);

  protected readonly opcionesRol = OPCIONES_ROL;
  protected readonly columnas = ['usuario', 'email', 'rol', 'acciones'];

  protected readonly filtrados = computed(() => {
    const rol = this.rolActivo();
    return this.usuarios().filter(
      (usuario) => coincideUsuario(usuario, this.busqueda()) && (!rol || usuario.rol === rol),
    );
  });

  protected readonly total = computed(() => this.usuarios().length);
  protected readonly administradores = computed(
    () => this.usuarios().filter((usuario) => usuario.rol === ROL_ADMIN).length,
  );

  constructor() {
    this.cargar();
  }

  protected iniciales(nombre: string | null | undefined): string {
    return iniciales(nombre);
  }

  protected onBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value ?? '');
  }

  protected onFiltrarRol(rol: string): void {
    this.rolActivo.set(this.rolActivo() === rol ? '' : rol);
  }

  /** Un usuario no puede borrarse a si mismo desde su propia sesion. */
  protected esPropio(usuario: Usuario): boolean {
    return this.sesion.usuario()?.id === usuario.id;
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

  protected eliminar(usuario: Usuario): void {
    this.guardando.set(true);
    ConfirmarBorrado.abrir(this.dialog, {
      titulo: 'Eliminar usuario',
      mensaje: `Se eliminará a ${usuario.nombre} (${usuario.email}).`,
      advertencia:
        'La base de datos borra en cascada todas las reservas de este usuario. Esta acción no se puede deshacer.',
      aceptar: 'Eliminar usuario',
    }).subscribe({
      next: (confirmado) => {
        if (!confirmado) {
          this.guardando.set(false);
          return;
        }

        this.usuariosService.eliminar(usuario.id).subscribe({
          next: () => {
            this.guardando.set(false);
            // Si nos borramos a nosotros mismos, la sesión deja de ser válida.
            if (this.sesion.usuario()?.id === usuario.id) {
              this.sesion.cerrar();
            }
            this.aviso.exito('Usuario eliminado.');
            this.cargar();
          },
          error: (error: Error) => {
            this.guardando.set(false);
            this.aviso.error(error);
          },
        });
      },
      error: () => this.guardando.set(false),
    });
  }
}
