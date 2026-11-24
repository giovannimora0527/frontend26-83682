import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Despacho, DespachoConfirmarRq, DespachoFormula, DespachoMedicamento, FormulaPendiente, HistorialFormula
} from 'src/app/models/despacho';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

export interface FiltroDespacho {
  texto: string;
  desde: string;
  hasta: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  private api = 'despacho';

  constructor(private readonly backendService: BackendService) { }

  listarPendientes({ texto, desde, hasta, estado }: FiltroDespacho): Observable<FormulaPendiente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'formulas-pendientes', construirParams({ texto, desde, hasta, estado }));
  }

  obtener(formulaId: number): Observable<DespachoFormula> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `formula/${formulaId}`);
  }

  preparar(formulaId: number): Observable<RespuestaApi<DespachoFormula>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `formula/${formulaId}/preparar`, null);
  }

  /** La clave evita descontar dos veces si se repite la misma confirmación. */
  confirmar(despachoId: number, datos: DespachoConfirmarRq, clave: string): Observable<RespuestaApi<Despacho>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${despachoId}/confirmar`, datos, { 'Idempotency-Key': clave });
  }

  liberar(despachoId: number): Observable<RespuestaApi<DespachoFormula>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${despachoId}/liberar`, null);
  }

  cancelar(formulaId: number, motivo: string): Observable<RespuestaApi<DespachoFormula>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `formula/${formulaId}/cancelar`, { motivo });
  }

  revertir(despachoId: number, motivo: string): Observable<RespuestaApi<Despacho>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, `${despachoId}/revertir`, { motivo });
  }

  historial({ texto, desde, hasta, estado }: FiltroDespacho): Observable<Despacho[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'historial', construirParams({ texto, desde, hasta, estado }));
  }

  historialMedicamento(medicamentoId: number): Observable<DespachoMedicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `medicamento/${medicamentoId}/historial`);
  }

  historialEstados(formulaId: number): Observable<HistorialFormula[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `formula/${formulaId}/historial-estados`);
  }
}
