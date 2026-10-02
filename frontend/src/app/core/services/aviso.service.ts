import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mensajeDe } from '../api-error';

/** Avisos uniformes de exito y error en toda la aplicacion. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  private readonly snackBar = inject(MatSnackBar);

  exito(texto: string): void {
    this.abrir(texto, 'exito');
  }

  info(texto: string): void {
    this.abrir(texto, 'info');
  }

  /** Acepta un ErrorApi o cualquier error y muestra su mensaje. */
  error(error: unknown): void {
    this.snackBar.open(mensajeDe(error), 'Cerrar', {
      duration: 7000,
      panelClass: ['aviso', 'aviso--error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  private abrir(texto: string, tipo: 'exito' | 'info'): void {
    this.snackBar.open(texto, 'Ok', {
      duration: 3500,
      panelClass: ['aviso', `aviso--${tipo}`],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
