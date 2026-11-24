import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/** Rutas públicas de autenticación: no llevan token ni pasan por el manejo global de errores. */
export function esRutaPublica(url: string): boolean {
  return ['login', 'validate-token'].some((ruta) => url === `${environment.apiUrlAuth}/auth/${ruta}`);
}

/**
 * Agrega el Bearer a las peticiones del API. No fija Content-Type: HttpClient usa application/json
 * para objetos y deja que el navegador defina el boundary cuando el cuerpo es FormData.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  if (!token || !req.url.startsWith(`${environment.apiUrlAuth}/`) || esRutaPublica(req.url)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
