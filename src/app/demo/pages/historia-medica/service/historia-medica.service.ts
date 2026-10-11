import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {
  private api = `historia-medica`;

  constructor(private backendService: BackendService) { }

  listarHistorias(fechaInicial?: string, fechaFinal?: string): Observable<HistoriaMedica[]> {
    let params = new HttpParams();
    if (fechaInicial && fechaFinal) {
      params = params.set('fechaInicial', fechaInicial).set('fechaFinal', fechaFinal);
    }
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar", params);
  }
}
