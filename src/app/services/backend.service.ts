import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Centraliza las peticiones HTTP dirigidas a la API del sistema.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Consulta un recurso del backend.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @param routerParams Parámetros opcionales de consulta.
   * @returns Respuesta tipada de la API.
   */
  get<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ): Observable<T> {
    return this.http.get<T>(this.buildUrl(urlApi, endpoint, service), {
      params: routerParams
    });
  }

  /**
   * Envía información para crear un recurso.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @param data Cuerpo de la petición.
   * @returns Respuesta tipada de la API.
   */
  post<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(urlApi, endpoint, service), data);
  }

  /**
   * Envía información para reemplazar o actualizar un recurso.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @param data Cuerpo de la petición.
   * @returns Respuesta tipada de la API.
   */
  put<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(urlApi, endpoint, service), data);
  }

  /**
   * Envía una actualización parcial de un recurso.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @param data Campos que se actualizarán.
   * @returns Respuesta tipada de la API.
   */
  patch<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.patch<T>(this.buildUrl(urlApi, endpoint, service), data);
  }

  /**
   * Elimina o desactiva un recurso identificado por su id.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param id Identificador del recurso.
   * @returns Respuesta tipada de la API.
   */
  delete<T>(urlApi: string, endpoint: string, id: number | string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(urlApi, endpoint, String(id)));
  }

  /**
   * Envía archivos mediante un formulario multipart.
   * El navegador asigna automáticamente Content-Type y su límite multipart.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @param data FormData con los campos y archivos.
   * @returns Respuesta tipada de la API.
   */
  postFile<T>(urlApi: string, endpoint: string, service: string, data: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(urlApi, endpoint, service), data);
  }

  /**
   * Une la base, el recurso y la acción sin duplicar separadores.
   * @param urlApi Base de la API.
   * @param endpoint Nombre del recurso.
   * @param service Acción del recurso.
   * @returns URL completa del endpoint.
   */
  private buildUrl(urlApi: string, endpoint: string, service: string): string {
    const base = urlApi.replace(/\/+$/, '');
    const segments = [endpoint, service]
      .filter((segment) => segment.length > 0)
      .map((segment) => segment.replace(/^\/+|\/+$/g, ''));

    return [base, ...segments].filter((segment) => segment.length > 0).join('/');
  }
}

/**
 * Obtiene un mensaje seguro del backend o utiliza el texto alternativo.
 * @param error Error recibido de la petición.
 * @param fallback Mensaje claro para mostrar al usuario.
 * @returns Mensaje de error legible.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null && 'message' in body
      && typeof body.message === 'string') {
    return body.message;
  }

  return fallback;
}
