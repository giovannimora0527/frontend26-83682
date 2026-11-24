import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from 'src/app/models/respuesta';
import { ConfiguracionClinica, HistorialTarifa, Impuesto, ImpuestoRq, Tarifa, TarifaActualizarRq, TarifaCrearRq } from 'src/app/models/tarifa';
import { BackendService } from 'src/app/services/backend.service';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TarifaService {
  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Tarifa[]> {
    return this.backendService.get(environment.apiUrlAuth, 'tarifa', 'listar');
  }

  crear(tarifa: TarifaCrearRq): Observable<RespuestaApi<Tarifa>> {
    return this.backendService.post(environment.apiUrlAuth, 'tarifa', 'crear', tarifa);
  }

  /** Cierra la tarifa vigente y crea otra: la respuesta trae un id nuevo. */
  actualizar(id: number, cambio: TarifaActualizarRq): Observable<RespuestaApi<Tarifa>> {
    return this.backendService.put(environment.apiUrlAuth, 'tarifa', String(id), cambio);
  }

  historial({ desde, hasta }: RangoFechas): Observable<HistorialTarifa[]> {
    return this.backendService.get(environment.apiUrlAuth, 'tarifa', 'historial', construirParams({ desde, hasta }));
  }

  listarImpuestos(): Observable<Impuesto[]> {
    return this.backendService.get(environment.apiUrlAuth, 'impuesto', 'listar');
  }

  crearImpuesto(impuesto: ImpuestoRq): Observable<RespuestaApi<Impuesto>> {
    return this.backendService.post(environment.apiUrlAuth, 'impuesto', 'crear', impuesto);
  }

  actualizarImpuesto(id: number, impuesto: ImpuestoRq): Observable<RespuestaApi<Impuesto>> {
    return this.backendService.put(environment.apiUrlAuth, 'impuesto', String(id), impuesto);
  }

  obtenerConfiguracion(): Observable<ConfiguracionClinica> {
    return this.backendService.get(environment.apiUrlAuth, 'configuracion-clinica', '');
  }

  guardarConfiguracion(configuracion: ConfiguracionClinica): Observable<RespuestaApi<ConfiguracionClinica>> {
    return this.backendService.put(environment.apiUrlAuth, 'configuracion-clinica', '', configuracion);
  }
}
