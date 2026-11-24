import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadoFormula } from 'src/app/models/estados';
import { FormulaMedica, FormulaMedicaRq } from 'src/app/models/formula-medica';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

export interface FiltroFormulas {
  desde: string;
  hasta: string;
  estado: EstadoFormula | '';
}

@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  private api = `formula-medica`;

  constructor(private readonly backendService: BackendService) { }

  listar({ desde, hasta, estado }: FiltroFormulas): Observable<FormulaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams({ desde, hasta, estado }));
  }

  listarPorCita(citaId: number): Observable<FormulaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `cita/${citaId}`);
  }

  crear(formula: FormulaMedicaRq): Observable<RespuestaApi<FormulaMedica>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', formula);
  }

  actualizar(id: number, formula: FormulaMedicaRq): Observable<RespuestaApi<FormulaMedica>> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), formula);
  }

  confirmar(id: number): Observable<RespuestaApi<FormulaMedica>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${id}/confirmar`, null);
  }

  anular(id: number, motivo: string): Observable<RespuestaApi<FormulaMedica>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${id}/anular`, { motivo });
  }
}
