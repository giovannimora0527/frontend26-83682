import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Servicio } from 'src/app/models/servicio';
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
}
