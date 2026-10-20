import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico } from 'src/app/models/medico';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  private api = `medico`;

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  // --- AGREGA ESTOS DOS MÉTODOS ---
  guardar(medico: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "guardar", medico);
  }

  actualizar(medico: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", medico);
  }
}