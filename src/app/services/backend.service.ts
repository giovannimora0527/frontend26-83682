import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Peticiones genéricas al backend. El token y los errores comunes los manejan los interceptores. */
@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private readonly http: HttpClient) { }

  get<T>(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<T> {
    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, { params: routerParams });
  }

  post<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data);
  }

  put<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data);
  }
}
