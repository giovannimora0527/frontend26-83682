import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api = `cita`;

  constructor(private backendService: BackendService) { }

  listarPorFecha(fechaInicial: string, fechaFinal: string): Observable<Cita[]> {
    const params = new HttpParams().set('fechaInicial', fechaInicial).set('fechaFinal', fechaFinal);
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-por-fecha", params);
  }
}
