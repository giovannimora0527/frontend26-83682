import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CitaPorFacturar, Factura, FacturaGenerarRq, FacturaPrevia, HistorialFactura, PagoRq } from 'src/app/models/factura';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

export interface FiltroFacturas {
  desde: string;
  hasta: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private api = 'factura';

  constructor(private readonly backendService: BackendService) { }

  listarPendientes(): Observable<CitaPorFacturar[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'citas-pendientes');
  }

  previsualizar(citaId: number): Observable<FacturaPrevia> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `previsualizar/${citaId}`);
  }

  generar(datos: FacturaGenerarRq): Observable<RespuestaApi<Factura>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'generar', datos);
  }

  listar({ desde, hasta, estado }: FiltroFacturas): Observable<Factura[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams({ desde, hasta, estado }));
  }

  listarPorCliente(clienteId: number): Observable<Factura[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `cliente/${clienteId}`);
  }

  listarPorMascota(mascotaId: number): Observable<Factura[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `mascota/${mascotaId}`);
  }

  obtener(id: number): Observable<Factura> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(id));
  }

  pagar(id: number, pago: PagoRq): Observable<RespuestaApi<Factura>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${id}/pagos`, pago);
  }

  anular(id: number, motivo: string): Observable<RespuestaApi<Factura>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${id}/anular`, { motivo });
  }

  historialEstados(id: number): Observable<HistorialFactura[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}/historial-estados`);
  }
}
