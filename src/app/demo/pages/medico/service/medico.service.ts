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

  constructor(private backendService: BackendService) { }

  listarMedicos(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-todos");
  }
}
