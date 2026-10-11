import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Especializacion } from 'src/app/models/especializacion';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {
  private api = `especializacion`;

  constructor(private backendService: BackendService) { }

  listarEspecializaciones(): Observable<Especializacion[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-todos");
  }
}
