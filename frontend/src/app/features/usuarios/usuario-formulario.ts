import { Component, computed, inject, input, type OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { ROL_CIUDADANO } from '../../core/config';
import type { CambiosUsuario, Usuario } from '../../core/models/modelos';
import { OPCIONES_ROL } from '../../core/models/usuario.model';
import { AvisoService } from '../../core/services/aviso.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { PaginaCabecera } from '../../shared/components/pagina-cabecera/pagina-cabecera';

/** Alta y edicion de usuarios. `id` solo existe en modo edicion. */
@Component({
  selector: 'app-usuario-formulario',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    Cargando,
    EstadoVacio,
    PaginaCabecera,
  ],
  templateUrl: './usuario-formulario.html',
  styleUrl: './usuario-formulario.scss',
})
export class UsuarioFormulario implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly aviso = inject(AvisoService);
  private readonly router = inject(Router);

  /** Enlazado desde la ruta con withComponentInputBinding(). */
  readonly id = input<string>();

  protected readonly opcionesRol = OPCIONES_ROL;
  protected readonly original = signal<Usuario | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorCarga = signal<Error | null>(null);

  protected readonly esEdicion = computed(() => this.id() !== undefined);

  protected readonly titulo = computed(() =>
    this.esEdicion() ? 'Editar usuario' : 'Nuevo usuario',
  );

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    // En edicion la contrasena es opcional: solo se envia si se escribe algo.
    password: ['', [Validators.minLength(4)]],
    rol: [ROL_CIUDADANO, [Validators.required]],
  });

  /**
   * El id de ruta no esta disponible en el constructor, asi que la carga y el
   * ajuste de validadores esperan a ngOnInit.
   */
  ngOnInit(): void {
    if (!this.esEdicion()) {
      // Al crear, la contrasena es obligatoria.
      this.formulario.controls.password.addValidators(Validators.required);
      this.formulario.controls.password.updateValueAndValidity();
      return;
    }
    this.cargar();
  }

  /** El backend ignora las cadenas vacias, asi que solo mandamos lo cambiado. */
  private cambios(): CambiosUsuario {
    const valores = this.formulario.getRawValue();
    const base = this.original();

    if (!base) {
      const cuerpo: CambiosUsuario = { ...valores };
      if (!cuerpo.password) {
        delete cuerpo.password;
      }
      return cuerpo;
    }

    const cuerpo: CambiosUsuario = {};
    if (valores.nombre !== base.nombre) cuerpo.nombre = valores.nombre;
    if (valores.email !== base.email) cuerpo.email = valores.email;
    if (valores.rol !== base.rol) cuerpo.rol = valores.rol;
    if (valores.password) cuerpo.password = valores.password;
    return cuerpo;
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const cuerpo = this.cambios();

    if (this.esEdicion() && Object.keys(cuerpo).length === 0) {
      this.aviso.info('No hay cambios que guardar.');
      return;
    }

    this.guardando.set(true);

    const peticion = this.esEdicion()
      ? this.usuariosService.actualizar(this.id()!, cuerpo)
      : this.usuariosService.crear(cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.aviso.exito(this.esEdicion() ? 'Usuario actualizado.' : 'Usuario creado.');
        void this.router.navigate(['/usuarios']);
      },
      error: (error: Error) => {
        this.guardando.set(false);
        this.aviso.error(error);
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.usuariosService.obtener(this.id()!).subscribe({
      next: (usuario) => {
        this.original.set(usuario);
        this.formulario.patchValue({
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          password: '',
        });
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
