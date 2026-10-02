import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { etiquetaEstado } from '../../../core/models/reserva.model';
import { etiquetaRol } from '../../../core/models/usuario.model';

type Variante =
  'confirmada' | 'cancelada' | 'disponible' | 'mantenimiento' | 'admin' | 'ciudadano' | 'neutro';

/**
 * Chip de color para los estados de la aplicacion:
 * confirmada / cancelada / disponible / mantenimiento / ciudadano / admin.
 */
@Component({
  selector: 'app-chip-estado',
  imports: [MatIconModule],
  template: `
    <span class="chip" [class]="'chip--' + variante()">
      @if (icono()) {
        <mat-icon class="chip__icono">{{ icono() }}</mat-icon>
      }
      {{ texto() }}
    </span>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.6;
        white-space: nowrap;
      }
      .chip__icono {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .chip--confirmada,
      .chip--disponible {
        background: color-mix(in srgb, var(--mat-sys-tertiary) 18%, transparent);
        color: var(--mat-sys-tertiary);
      }
      .chip--cancelada,
      .chip--mantenimiento {
        background: color-mix(in srgb, var(--mat-sys-error) 15%, transparent);
        color: var(--mat-sys-error);
      }
      .chip--admin {
        background: color-mix(in srgb, var(--mat-sys-primary) 16%, transparent);
        color: var(--mat-sys-primary);
      }
      .chip--ciudadano,
      .chip--neutro {
        background: color-mix(in srgb, var(--mat-sys-outline) 13%, transparent);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class ChipEstado {
  /** Cualquiera de los valores reconocidos. */
  readonly estado = input.required<string | number | boolean>();

  readonly variante = computed<Variante>(() => {
    const valor = this.estado();
    if (valor === 1 || valor === '1' || valor === true) return 'disponible';
    if (valor === 0 || valor === '0' || valor === false) return 'mantenimiento';
    const texto = String(valor).toLowerCase();
    return ['confirmada', 'cancelada', 'admin', 'ciudadano'].includes(texto)
      ? (texto as Variante)
      : 'neutro';
  });

  readonly texto = computed(() => {
    switch (this.variante()) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'disponible':
        return 'Disponible';
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'admin':
      case 'ciudadano':
        return etiquetaRol(this.variante());
      default:
        return etiquetaEstado(String(this.estado()));
    }
  });

  readonly icono = computed(() => {
    switch (this.variante()) {
      case 'confirmada':
        return 'check_circle';
      case 'cancelada':
        return 'cancel';
      case 'disponible':
        return 'check_circle';
      case 'mantenimiento':
        return 'build';
      case 'admin':
        return 'shield';
      case 'ciudadano':
        return 'person';
      default:
        return '';
    }
  });
}
