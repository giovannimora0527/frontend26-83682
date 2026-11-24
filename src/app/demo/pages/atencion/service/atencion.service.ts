import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Atencion, AtencionCita, AtencionRq } from 'src/app/models/atencion';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtencionService {
  private api = 'atencion';

  constructor(private readonly backendService: BackendService) { }

  /** Idempotente: si la atención ya existe, la devuelve. */
  iniciar(citaId: number): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `iniciar/${citaId}`, null);
  }

  obtener(citaId: number): Observable<AtencionCita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `cita/${citaId}`);
  }

  guardar(id: number, atencion: AtencionRq): Observable<RespuestaApi<Atencion>> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), atencion);
  }

  finalizar(id: number): Observable<RespuestaApi<Atencion>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${id}/finalizar`, null);
  }
}
