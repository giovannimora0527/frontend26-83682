import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from 'src/app/models/respuesta';
import { Servicio, ServicioRq } from 'src/app/models/servicio';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private api = 'servicio';

  constructor(private readonly backendService: BackendService) { }

  listar(soloActivos = false): Observable<Servicio[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams({ soloActivos: soloActivos || null }));
  }

  crear(servicio: ServicioRq): Observable<RespuestaApi<Servicio>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', servicio);
  }

  actualizar(id: number, servicio: ServicioRq): Observable<RespuestaApi<Servicio>> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), servicio);
  }

  cambiarEstado(id: number, activo: boolean): Observable<RespuestaApi<Servicio>> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
