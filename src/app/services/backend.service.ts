import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

/** Servicio de backend: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class BackendService {
  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param http cliente HTTP de Angular.
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene backend mediante la API del backend.
   *
   * @param urlApi URL API.
   * @param endpoint endpoint.
   * @param service service.
   * @param routerParams router params.
   * @returns observable con la respuesta del backend.
   */
  get<T>(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams) {
    return this.http.get<T>([urlApi, endpoint, service].join('/'), { params: routerParams });
  }

  /**
   * Envía una solicitud POST backend mediante la API del backend.
   *
   * @param urlApi URL API.
   * @param endpoint endpoint.
   * @param service service.
   * @param data data.
   * @returns observable con la respuesta del backend.
   */
  post<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.http.post<T>([urlApi, endpoint, service].join('/'), data);
  }

  /**
   * Envía una solicitud PUT backend mediante la API del backend.
   *
   * @param urlApi URL API.
   * @param endpoint endpoint.
   * @param service service.
   * @param data data.
   * @returns observable con la respuesta del backend.
   */
  put<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.http.put<T>([urlApi, endpoint, service].join('/'), data);
  }

  /**
   * Envía una solicitud POST file.
   *
   * @param urlApi URL API.
   * @param endpoint endpoint.
   * @param service service.
   * @param data data.
   */
  postFile<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.post<T>(urlApi, endpoint, service, data);
  }
}
