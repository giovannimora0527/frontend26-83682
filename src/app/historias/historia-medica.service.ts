import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HistoriaMedica } from './historia-medica.model';

/**
 * Servicio encargado de comunicarse con el backend para el CRUD completo
 * de Historia Medica (Requerimiento 5 del backend).
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {

  /** URL base de los endpoints de historia medica. */
  private readonly urlBase = `${environment.apiUrl}/historias`;

  constructor(private http: HttpClient) { }

  /**
   * Lista todas las historias medicas, o las filtra por un rango de
   * fechas si se envian fechaInicio y fechaFin.
   * Corresponde a: GET /api/historias  o  GET /api/historias?fechaInicio=...&fechaFin=...
   *
   * @param fechaInicio fecha inicial del filtro (opcional)
   * @param fechaFin    fecha final del filtro (opcional)
   * @return un Observable que emite la lista de historias medicas
   */
  listar(fechaInicio?: string, fechaFin?: string): Observable<HistoriaMedica[]> {
    let parametros = new HttpParams();
    if (fechaInicio && fechaFin) {
      parametros = parametros.set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    }
    return this.http.get<HistoriaMedica[]>(this.urlBase, { params: parametros });
  }

  /**
   * Consulta una historia medica especifica por su id.
   * Corresponde a: GET /api/historias/{id}
   *
   * @param id identificador de la historia medica
   * @return un Observable que emite la historia medica encontrada
   */
  obtenerPorId(id: number): Observable<HistoriaMedica> {
    return this.http.get<HistoriaMedica>(`${this.urlBase}/${id}`);
  }

  /**
   * Crea una nueva historia medica.
   * Corresponde a: POST /api/historias
   *
   * @param historia datos de la historia medica a crear
   * @return un Observable que emite la historia medica ya creada
   */
  crear(historia: HistoriaMedica): Observable<HistoriaMedica> {
    return this.http.post<HistoriaMedica>(this.urlBase, historia);
  }

  /**
   * Actualiza una historia medica existente.
   * Corresponde a: PUT /api/historias/{id}
   *
   * @param id      identificador de la historia medica a actualizar
   * @param historia nuevos datos de la historia medica
   * @return un Observable que emite la historia medica ya actualizada
   */
  actualizar(id: number, historia: HistoriaMedica): Observable<HistoriaMedica> {
    return this.http.put<HistoriaMedica>(`${this.urlBase}/${id}`, historia);
  }

  /**
   * Elimina una historia medica.
   * Corresponde a: DELETE /api/historias/{id}
   *
   * @param id identificador de la historia medica a eliminar
   * @return un Observable que se completa cuando la eliminacion termina
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
