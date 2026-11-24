import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reporte, ReporteCatalogo } from 'src/app/models/reporte';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private api = 'reporte';

  constructor(private readonly backendService: BackendService) { }

  catalogo(): Observable<ReporteCatalogo[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'catalogo');
  }

  consultar(codigo: string, filtros: Record<string, string>): Observable<Reporte> {
    return this.backendService.get(environment.apiUrlAuth, this.api, codigo, construirParams(filtros));
  }
}
