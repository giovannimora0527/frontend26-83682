import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HistoriaDetalle, HistoriaMedica, HistoriaRq } from '../models/historia-medica';
import { AnotacionHistoria } from '../models/anotacion-historia';

/**
 * Consumo de la API de historias clínicas.
 * Endpoints: GET /historia-medica/listar-todos, GET /historia-medica/{id}, POST /historia-medica/crear,
 * PUT /historia-medica/actualizar/{id}, GET /historia-medica/{id}/anotaciones.
 */
@Injectable({ providedIn: 'root' })
export class HistoriaMedicaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrlAuth}/historia-medica`;

  /** Lista historias (más recientes primero) con filtro opcional por rango de fechas. */
  listarHistoriasMedicas(fechaInicio?: string, fechaFin?: string): Observable<HistoriaMedica[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<HistoriaMedica[]>(`${this.apiUrl}/listar-todos`, { params });
  }

  /** Historias clínicas de una mascota. */
  listarHistoriasPorPaciente(pacienteId: number): Observable<HistoriaMedica[]> {
    return this.http.get<HistoriaMedica[]>(`${this.apiUrl}/listar-por-paciente/${pacienteId}`);
  }

  /** Detalle de una historia con su histórico de anotaciones y fórmulas. */
  consultar(id: number): Observable<HistoriaDetalle> {
    return this.http.get<HistoriaDetalle>(`${this.apiUrl}/${id}`);
  }

  crear(datos: HistoriaRq): Observable<HistoriaDetalle> {
    return this.http.post<HistoriaDetalle>(`${this.apiUrl}/crear`, datos);
  }

  actualizar(id: number, datos: HistoriaRq): Observable<HistoriaDetalle> {
    return this.http.put<HistoriaDetalle>(`${this.apiUrl}/actualizar/${id}`, datos);
  }

  /** Anotaciones de una historia, de la más reciente a la más antigua. */
  anotaciones(id: number): Observable<AnotacionHistoria[]> {
    return this.http.get<AnotacionHistoria[]>(`${this.apiUrl}/${id}/anotaciones`);
  }
}
