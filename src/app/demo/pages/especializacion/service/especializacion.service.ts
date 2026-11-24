import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Especializacion } from 'src/app/models/especializacion';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {

  private api = `especializacion`;

  constructor(private backendService: BackendService) {

  }

  listar(soloActivas = false): Observable<Especializacion[]> {
    const params = construirParams({ soloActivas: soloActivas || null });
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', params);
  }

  cambiarEstado(id: number, activo: boolean): Observable<unknown> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }

  crearEspecializacion(especializacion: Especializacion): Observable<Especializacion> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "crear", especializacion);
  }

  actualizarEspecializacion(especializacion: Especializacion): Observable<Especializacion> {
    return this.backendService.put(environment.apiUrlAuth, this.api, "actualizar", especializacion);
  }
}
