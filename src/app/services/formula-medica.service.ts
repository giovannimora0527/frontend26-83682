import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FormulaMedica, FormulaRq } from '../models/formula-medica';

/**
 * Consumo de la API de fórmulas médicas.
 * Endpoints: GET /formula-medica/listar-todos, GET /formula-medica/consultar/{id}, POST /formula-medica/crear,
 * PUT /formula-medica/actualizar/{id}, PATCH /formula-medica/{id}/estado.
 */
@Injectable({ providedIn: 'root' })
export class FormulaMedicaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrlAuth}/formula-medica`;

  /** Fórmulas ordenadas por fecha de creación descendente. */
  listarFormulasMedicas(): Observable<FormulaMedica[]> {
    return this.http.get<FormulaMedica[]>(`${this.apiUrl}/listar-todos`);
  }

  consultarFormula(id: number): Observable<FormulaMedica> {
    return this.http.get<FormulaMedica>(`${this.apiUrl}/consultar/${id}`);
  }

  crearFormula(formula: FormulaRq): Observable<FormulaMedica> {
    return this.http.post<FormulaMedica>(`${this.apiUrl}/crear`, formula);
  }

  actualizarFormula(id: number, formula: FormulaRq): Observable<FormulaMedica> {
    return this.http.put<FormulaMedica>(`${this.apiUrl}/actualizar/${id}`, formula);
  }

  /** Activa o inactiva una fórmula (no se eliminan físicamente). */
  cambiarEstado(id: number, activo: boolean): Observable<FormulaMedica> {
    return this.http.patch<FormulaMedica>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
