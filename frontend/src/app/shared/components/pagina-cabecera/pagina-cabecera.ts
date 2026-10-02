import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Cabecera de pagina: titulo, descripcion y acciones a la derecha. */
@Component({
  selector: 'app-pagina-cabecera',
  imports: [MatIconModule],
  template: `
    <header class="cabecera">
      <div class="cabecera__texto">
        @if (icono()) {
          <mat-icon class="cabecera__icono">{{ icono() }}</mat-icon>
        }
        <div>
          <h1 class="cabecera__titulo">{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="cabecera__subtitulo">{{ subtitulo() }}</p>
          }
        </div>
      </div>
      <div class="cabecera__acciones">
        <ng-content />
      </div>
    </header>
  `,
  styles: [
    `
      .cabecera {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
      }
      .cabecera__texto {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .cabecera__icono {
        width: 40px;
        height: 40px;
        font-size: 40px;
        color: var(--mat-sys-primary);
      }
      .cabecera__titulo {
        margin: 0;
        font: var(--mat-sys-headline-small);
        letter-spacing: -0.01em;
      }
      .cabecera__subtitulo {
        margin: 2px 0 0;
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }
      .cabecera__acciones {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      @media (max-width: 600px) {
        .cabecera__icono {
          display: none;
        }
      }
    `,
  ],
})
export class PaginaCabecera {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly icono = input('');
}
