import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Auth interceptor.
 *
 * @param request request.
 * @param next siguiente manejador de la cadena HTTP.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = new URL(environment.apiUrlAuth, document.baseURI);
  const url = new URL(request.url, document.baseURI);
  if (base.origin !== url.origin || !url.pathname.startsWith(base.pathname + '/')
      || ['login', 'verificar', 'reenviar', 'recuperar', 'restablecer']
        .some(ruta => url.pathname === base.pathname + '/auth/' + ruta)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.obtenerToken();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (token === auth.obtenerToken()) {
        if (error.status === 401) {
          auth.cerrarSesion();
          void router.navigateByUrl('/login', { replaceUrl: true });
        } else if (error.status === 403) {
          auth.mostrarAccesoDenegado();
        }
      }
      return throwError(() => error);
    })
  );
};
