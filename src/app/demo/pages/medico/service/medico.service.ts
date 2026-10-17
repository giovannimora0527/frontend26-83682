import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico } from 'src/app/models/medico';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private readonly api = 'medico';

  constructor(private readonly backendService: BackendService) {}

  listarMedicos(): Observable<Medico[]> {
    return this.backendService.get<Medico[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  eliminarMedico(id: number): Observable<void> {
    return this.backendService.delete<void>(environment.apiUrlAuth, this.api, id);
  }
}
