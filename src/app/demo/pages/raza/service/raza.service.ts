import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Raza } from 'src/app/models/raza';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RazaService {
  private readonly api = 'raza';

  constructor(private readonly backendService: BackendService) {}

  listarRazas(): Observable<Raza[]> {
    return this.backendService.get<Raza[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardarRaza(raza: Raza): Observable<Raza> {
    return this.backendService.post<Raza>(environment.apiUrlAuth, this.api, 'guardar', raza);
  }

  actualizarRaza(raza: Raza): Observable<Raza> {
    return this.backendService.post<Raza>(environment.apiUrlAuth, this.api, 'actualizar', raza);
  }

  eliminarRaza(id: number): Observable<void> {
    return this.backendService.delete<void>(environment.apiUrlAuth, this.api, id);
  }
}
