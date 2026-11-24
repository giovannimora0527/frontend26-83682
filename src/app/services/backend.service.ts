import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  patch<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.patch<T>(`${urlApi}/${endpoint}/${service}`, data);
  }

  delete<T>(urlApi: string, endpoint: string, service: string): Observable<T> {
    return this.http.delete<T>(`${urlApi}/${endpoint}/${service}`);
  }

  /** Descarga binaria. Si falla, el cuerpo del error se entrega como JSON y no como Blob. */
  getBlob(endpoint: string, params?: HttpParams): Observable<HttpResponse<Blob>> {
    return this.http
      .get(`${environment.apiUrlAuth}/${endpoint}`, { params, responseType: 'blob', observe: 'response' })
      .pipe(catchError((error: unknown) => this.leerErrorBlob(error)));
  }

  postArchivo<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${environment.apiUrlAuth}/${endpoint}`, formData);
  }

  private leerErrorBlob(error: unknown): Observable<never> {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
      return throwError(() => error);
    }
    return from(error.error.text()).pipe(
      switchMap((texto) => throwError(() => new HttpErrorResponse({
        error: this.parsear(texto),
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined
      })))
    );
  }

  private parsear(texto: string): unknown {
    try {
      return JSON.parse(texto);
    } catch {
      return null;
    }
  }
}
