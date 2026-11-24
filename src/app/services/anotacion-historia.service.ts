import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnotacionHistoria, AnotacionRq } from '../models/anotacion-historia';

/**
 * Consumo de la API de anotaciones de historias clínicas.
 * Endpoints: GET /anotacion-historia/listar-todos, GET /anotacion-historia/{id},
 * POST /anotacion-historia/crear, PUT /anotacion-historia/actualizar/{id}.
 */
@Injectable({ providedIn: 'root' })
export class AnotacionHistoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrlAuth}/anotacion-historia`;

  /** Lista anotaciones (más recientes primero) con filtros opcionales. */
  listarAnotaciones(fechaInicio?: string, fechaFin?: string): Observable<AnotacionHistoria[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<AnotacionHistoria[]>(`${this.apiUrl}/listar-todos`, { params });
  }

  consultar(id: number): Observable<AnotacionHistoria> {
    return this.http.get<AnotacionHistoria>(`${this.apiUrl}/${id}`);
  }

  crear(datos: AnotacionRq): Observable<AnotacionHistoria> {
    return this.http.post<AnotacionHistoria>(`${this.apiUrl}/crear`, datos);
  }

  actualizar(id: number, datos: AnotacionRq): Observable<AnotacionHistoria> {
    return this.http.put<AnotacionHistoria>(`${this.apiUrl}/actualizar/${id}`, datos);
  }
}
