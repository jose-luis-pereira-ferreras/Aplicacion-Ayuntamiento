import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Observable } from 'rxjs';

/** Texto y botones de la confirmacion. Todos los campos son opcionales. */
export interface DatosConfirmacion {
  titulo?: string;
  mensaje: string;
  advertencia?: string;
  aceptar?: string;
  cancelar?: string;
}

/** Confirmacion para acciones destructivas. Se abre con `ConfirmarBorrado.abrir(dialog, {...})`. */
@Component({
  selector: 'app-confirmar-borrado',
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="titulo">
      <mat-icon class="titulo__icono">warning</mat-icon>
      {{ datos.titulo }}
    </h2>

    <mat-dialog-content>
      <p class="mensaje">{{ datos.mensaje }}</p>
      @if (datos.advertencia) {
        <p class="advertencia">
          <mat-icon class="advertencia__icono">info</mat-icon>
          <span>{{ datos.advertencia }}</span>
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton (click)="cancelar()">{{ datos.cancelar ?? 'Cancelar' }}</button>
      <button matButton="filled" class="peligro" (click)="confirmar()">
        {{ datos.aceptar ?? 'Eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .titulo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .titulo__icono {
        color: var(--mat-sys-error);
      }
      .mensaje {
        margin: 0;
        max-width: 44ch;
        color: var(--mat-sys-on-surface-variant);
      }
      .advertencia {
        display: flex;
        gap: 8px;
        margin: 16px 0 0;
        padding: 10px 12px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--mat-sys-error) 10%, transparent);
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-body-small);
      }
      .advertencia__icono {
        flex: 0 0 auto;
        color: var(--mat-sys-error);
      }
      .peligro {
        --mat-button-filled-container-color: var(--mat-sys-error);
        --mat-button-filled-label-text-color: var(--mat-sys-on-error);
      }
    `,
  ],
})
export class ConfirmarBorrado {
  private readonly dialogRef = inject<MatDialogRef<ConfirmarBorrado, boolean>>(MatDialogRef);
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);

  protected confirmar(): void {
    this.dialogRef.close(true);
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  /** Abre el dialogo. Emite `true` si se confirma y `undefined` si se cancela. */
  static abrir(
    dialog: MatDialog,
    datos: Partial<DatosConfirmacion> & Pick<DatosConfirmacion, 'mensaje'>,
  ): Observable<boolean | undefined> {
    const porDefecto: DatosConfirmacion = {
      titulo: '¿Confirmar la acción?',
      mensaje: '',
      advertencia: '',
      aceptar: 'Eliminar',
      cancelar: 'Cancelar',
    };

    return dialog
      .open<ConfirmarBorrado, DatosConfirmacion, boolean>(ConfirmarBorrado, {
        data: { ...porDefecto, ...datos },
        width: '440px',
        maxWidth: '92vw',
      })
      .afterClosed();
  }
}
