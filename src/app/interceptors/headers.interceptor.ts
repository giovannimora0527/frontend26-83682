import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Agrega el token de sesión a las solicitudes enviadas a la API.
 */
@Injectable()
export class HeadersInterceptor implements HttpInterceptor {
  /**
   * Reenvía la solicitud y agrega autorización cuando hay un token disponible.
   * @param request Solicitud HTTP original.
   * @param next Siguiente manejador de la cadena de interceptores.
   * @returns Evento HTTP de la solicitud procesada.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiPath = environment.apiUrlAuth;
    const isApiRequest = request.url.startsWith(apiPath);
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');

    if (!isApiRequest) {
      return next.handle(request);
    }

    const headers: Record<string, string> = {};

    if (!(request.body instanceof FormData) && !request.headers.has('Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }

    if (token && !request.headers.has('Authorization')) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return Object.keys(headers).length
      ? next.handle(request.clone({ setHeaders: headers }))
      : next.handle(request);
  }
}
