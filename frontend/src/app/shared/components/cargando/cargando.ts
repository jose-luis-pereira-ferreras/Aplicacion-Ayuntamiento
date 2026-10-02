import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Indicador de carga. `filas` dibuja esqueletos de tabla. */
@Component({
  selector: 'app-cargando',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="cargando" role="status" aria-live="polite">
      @if (filas() > 0) {
        @for (fila of esqueletos(); track fila) {
          <div class="hueso"></div>
        }
      } @else {
        <mat-spinner diameter="40" />
        <p class="cargando__texto">{{ texto() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .cargando {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 40px 16px;
      }
      .cargando__texto {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }
      .hueso {
        height: 52px;
        margin-bottom: 8px;
        border-radius: 12px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--mat-sys-outline) 10%, transparent) 25%,
          color-mix(in srgb, var(--mat-sys-outline) 20%, transparent) 37%,
          color-mix(in srgb, var(--mat-sys-outline) 10%, transparent) 63%
        );
        background-size: 400% 100%;
        animation: brillo 1.4s ease infinite;
      }
      @keyframes brillo {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
    `,
  ],
})
export class Cargando {
  readonly texto = input('Cargando…');
  /** Si es mayor que 0, dibuja `filas` esqueletos en vez de un spinner. */
  readonly filas = input(0);

  /** indices 0..filas-1, para que `@for` pueda hacer track por valor. */
  protected esqueletos(): number[] {
    return Array.from({ length: this.filas() }, (_, indice) => indice);
  }
}
