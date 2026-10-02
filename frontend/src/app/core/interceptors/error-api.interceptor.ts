import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { normalizarError } from '../api-error';

/**
 * Convierte los errores crudos de la API en ErrorApi para que ningun
 * componente tenga que inspeccionar HttpErrorResponse.
 */
export const errorApiInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => throwError(() => normalizarError(error))),
  );
