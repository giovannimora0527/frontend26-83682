import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { SesionService } from '../services/sesion.service';
import { esRutaPublica } from './auth.interceptor';

/**
 * Manejo global de 401, 403, 0 y 5xx. Los 400, 404 y 409 los muestra cada pantalla.
 * El error siempre se propaga para que la pantalla libere sus banderas de carga.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: unknown) => {
      const esDelApi = req.url.startsWith(`${environment.apiUrlAuth}/`);
      const esCierreSesion = req.url === `${environment.apiUrlAuth}/auth/cerrar-sesion`;

      if (error instanceof HttpErrorResponse && esDelApi && !esRutaPublica(req.url) && !esCierreSesion) {
        if (error.status === 401) {
          // Solo se cierra la sesión que hizo la petición: varias respuestas 401 no repiten el aviso
          // y una respuesta atrasada no cierra una sesión nueva.
          const token = sessionStorage.getItem('token');
          if (token && req.headers.get('Authorization') === `Bearer ${token}`) {
            injector.get(SesionService).expirar();
          }
        } else if (error.status === 403) {
          void Swal.fire('Acceso denegado', 'No tienes permiso para esta acción.', 'warning');
        } else if (error.status === 0 || error.status >= 500) {
          void Swal.fire('Error de comunicación', 'No fue posible completar la operación. Intenta nuevamente más tarde.', 'error');
        }
      }
      return throwError(() => error);
    })
  );
};
