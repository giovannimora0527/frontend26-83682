import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente, ClienteRq } from 'src/app/models/cliente';
import { Factura } from 'src/app/models/factura';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private api = 'cliente';

  constructor(private readonly backendService: BackendService) { }

  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  crearCliente(cliente: ClienteRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', cliente);
  }

  actualizarCliente(id: number, cliente: ClienteRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, String(id), cliente);
  }

  listarMascotas(clienteId: number): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, 'mascota', 'buscar-by-cliente', construirParams({ clienteId }));
  }

  listarFacturas(clienteId: number): Observable<Factura[]> {
    return this.backendService.get(environment.apiUrlAuth, 'factura', `cliente/${clienteId}`);
  }
}
