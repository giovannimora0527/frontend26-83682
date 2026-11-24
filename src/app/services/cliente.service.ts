import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente } from '../models/cliente';
import { BackendService } from './backend.service';
import { environment } from '../../environments/environment';

/** Servicio de cliente: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  /** Ruta del recurso en la API del backend. */
  private api = 'cliente';

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param backendService servicio backend.
   * @param http cliente HTTP de Angular.
   */
  constructor(
    /** Dependencia inyectada (BackendService). */
    private backendService: BackendService, private http: HttpClient
  ) {}


/**
 * Lista clientes mediante la API del backend.
 *
 * @returns observable con la respuesta del backend.
 */
listarClientes(): Observable<Cliente[]> {
  return this.backendService.get<Cliente[]>(
    environment.apiUrlAuth,
    this.api,
    'listar-todos'
  );
}

  /**
   * Consulta cliente mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  consultar(id: number) {
    return this.http.get<Cliente>(environment.apiUrlAuth + '/cliente/' + id);
  }

  /**
   * Guarda el dato de la sesión.
   *
   * @param datos datos a enviar.
   * @param id identificador del registro.
   */
  guardar(datos: object, id?: number) {
    return id ? this.backendService.put<Cliente>(environment.apiUrlAuth, this.api, String(id), datos)
      : this.http.post<Cliente>(environment.apiUrlAuth + '/cliente', datos);
  }

  /**
   * Archiva cliente mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  archivar(id: number) {
    return this.http.delete<void>(environment.apiUrlAuth + '/cliente/' + id);
  }
}
