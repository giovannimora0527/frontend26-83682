import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente } from '../../../../models/cliente';
import { BackendService } from '../../../../services/backend.service';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private api = 'cliente';

  constructor(private backendService: BackendService) {}

  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get<Cliente[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  consultarCliente(id: number): Observable<Cliente> {
    return this.backendService.get<Cliente>(environment.apiUrlAuth, this.api, String(id));
  }

  listarMascotas(id: number): Observable<import('../../../../models/mascota').Mascota[]> {
    return this.backendService.get<import('../../../../models/mascota').Mascota[]>(
      environment.apiUrlAuth, this.api, `${id}/mascotas`
    );
  }
}
