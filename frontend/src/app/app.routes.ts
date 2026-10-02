import type { Routes } from '@angular/router';
import { sesionGuard, sesionLibreGuard } from './core/guards/sesion.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'sesion',
    canActivate: [sesionLibreGuard],
    loadComponent: () =>
      import('./features/sesion/seleccionar-usuario').then((m) => m.SeleccionarUsuario),
  },

  {
    path: 'dashboard',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },

  {
    path: 'espacios',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/espacios/espacios-listado').then((m) => m.EspaciosListado),
  },
  {
    path: 'espacios/:id',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/espacios/espacio-detalle').then((m) => m.EspacioDetalle),
  },

  {
    path: 'usuarios/nuevo',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/usuarios/usuario-formulario').then((m) => m.UsuarioFormulario),
  },
  {
    path: 'usuarios/:id/editar',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/usuarios/usuario-formulario').then((m) => m.UsuarioFormulario),
  },
  {
    path: 'usuarios',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios-listado').then((m) => m.UsuariosListado),
  },

  // `agenda` y `nueva` van antes que `:id` para que no las capture el parametro.
  {
    path: 'reservas/agenda',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/reservas/reservas-agenda').then((m) => m.ReservasAgenda),
  },
  {
    path: 'reservas/nueva',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/reservas/reserva-formulario').then((m) => m.ReservaFormulario),
  },
  {
    path: 'reservas/:id',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/reservas/reserva-detalle').then((m) => m.ReservaDetalle),
  },
  {
    path: 'reservas',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./features/reservas/reservas-listado').then((m) => m.ReservasListado),
  },

  { path: '**', redirectTo: 'dashboard' },
];
