import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(private http: HttpClient) { }

  construirHeader() {
    const tokenRecuperado = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }
    return headers;
  }

  // Servicio generico para realizar peticiones GET al backend.
  get<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ) {
    return this.http.get<T>(this.buildUrl(urlApi, endpoint, service), {
      params: routerParams,
      headers: this.construirHeader(),
    });
  }


  // Servicio generico para realizar peticiones POST al backend.
  post<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    return this.http.post<T>(this.buildUrl(urlApi, endpoint, service), data, {
      headers: this.construirHeader(),
    });
  }

  // Servicio genérico para realizar peticiones DELETE al backend.
  delete<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ): Observable<T> {
    return this.http.delete<T>(this.buildUrl(urlApi, endpoint, service), {
      params: routerParams,
      headers: this.construirHeader(),
    });
  }

  // Servicio generico para realizar peticiones PUT al backend.
  put<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    return this.http.put<T>(this.buildUrl(urlApi, endpoint, service), data, {
      headers: this.construirHeader(),
    });
  }

  // Servicio generico para realizar peticiones POST al backend con archivos.
  postFile<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    return this.http.post<T>(this.buildUrl(urlApi, endpoint, service), data, {
      headers: this.construirHeader().delete('Content-Type'),
    });
  }

  private buildUrl(urlApi: string, endpoint: string, service: string): string {
    const path = [endpoint, service].filter(Boolean).join('/');
    return path ? `${urlApi.replace(/\/$/, '')}/${path}` : urlApi.replace(/\/$/, '');
  }
}
