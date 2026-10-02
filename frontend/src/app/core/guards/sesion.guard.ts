import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

/** Protege las pantallas privadas: sin usuario elegido, a la seleccion. */
export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.activo ? true : router.createUrlTree(['/sesion']);
};

/** Evita volver a la seleccion si ya hay usuario activo. */
export const sesionLibreGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.activo ? router.createUrlTree(['/dashboard']) : true;
};
