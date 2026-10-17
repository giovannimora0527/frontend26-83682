import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FormulaMedica } from './formula-medica.model';

/** Servicio responsable exclusivamente de consumir la API de fórmulas. */
@Injectable({ providedIn: 'root' })
export class FormulaMedicaService {
  private readonly urlBase = `${environment.apiUrl}/formulas`;
  constructor(private http: HttpClient) {}
  /** Lista fórmulas recientes primero. */
  listar(): Observable<FormulaMedica[]> { return this.http.get<FormulaMedica[]>(this.urlBase); }
  /** Consulta detalle completo por id. */
  obtener(id: number): Observable<FormulaMedica> { return this.http.get<FormulaMedica>(`${this.urlBase}/${id}`); }
  /** Registra una fórmula. */
  crear(formula: FormulaMedica): Observable<FormulaMedica> { return this.http.post<FormulaMedica>(this.urlBase, formula); }
  /** Actualiza una fórmula existente. */
  actualizar(id: number, formula: FormulaMedica): Observable<FormulaMedica> { return this.http.put<FormulaMedica>(`${this.urlBase}/${id}`, formula); }
}
