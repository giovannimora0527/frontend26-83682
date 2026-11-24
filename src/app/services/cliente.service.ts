import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente } from '../models/cliente';
import { BackendService } from './backend.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private api = 'cliente';

  constructor(
    private backendService: BackendService, private http: HttpClient
  ) {}


listarClientes(): Observable<Cliente[]> {
  return this.backendService.get<Cliente[]>(
    environment.apiUrlAuth,
    this.api,
    'listar-todos'
  );
}

  consultar(id: number) {
    return this.http.get<Cliente>(environment.apiUrlAuth + '/cliente/' + id);
  }

  guardar(datos: object, id?: number) {
    return id ? this.backendService.put<Cliente>(environment.apiUrlAuth, this.api, String(id), datos)
      : this.http.post<Cliente>(environment.apiUrlAuth + '/cliente', datos);
  }

  archivar(id: number) {
    return this.http.delete<void>(environment.apiUrlAuth + '/cliente/' + id);
  }
}
