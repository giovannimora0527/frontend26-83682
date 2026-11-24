import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BackendService {
  constructor(private http: HttpClient) {}

  get<T>(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams) {
    return this.http.get<T>([urlApi, endpoint, service].join('/'), { params: routerParams });
  }

  post<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.http.post<T>([urlApi, endpoint, service].join('/'), data);
  }

  put<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.http.put<T>([urlApi, endpoint, service].join('/'), data);
  }

  postFile<T>(urlApi: string, endpoint: string, service: string, data: unknown) {
    return this.post<T>(urlApi, endpoint, service, data);
  }
}
