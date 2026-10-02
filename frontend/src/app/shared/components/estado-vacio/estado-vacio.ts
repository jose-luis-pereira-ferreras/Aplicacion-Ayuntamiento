import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Estado vacio reutilizable con icono, texto y accion opcional. */
@Component({
  selector: 'app-estado-vacio',
  imports: [MatIconModule],
  template: `
    <div class="vacio">
      <mat-icon class="vacio__icono">{{ icono() }}</mat-icon>
      <h3 class="vacio__titulo">{{ titulo() }}</h3>
      @if (mensaje()) {
        <p class="vacio__mensaje">{{ mensaje() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .vacio {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 48px 24px;
        text-align: center;
      }
      .vacio__icono {
        width: 56px;
        height: 56px;
        font-size: 56px;
        color: color-mix(in srgb, var(--mat-sys-outline) 70%, transparent);
      }
      .vacio__titulo {
        margin: 4px 0 0;
        font: var(--mat-sys-title-medium);
        color: var(--mat-sys-on-surface);
      }
      .vacio__mensaje {
        margin: 0;
        max-width: 46ch;
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }
    `,
  ],
})
export class EstadoVacio {
  readonly icono = input('search_off');
  readonly titulo = input.required<string>();
  readonly mensaje = input('');
}
