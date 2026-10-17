import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cita } from './cita.model';

/**
 * Servicio encargado de comunicarse con el backend de Spring Boot para
 * todo lo relacionado con Citas.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {

  /** URL base de los endpoints de cita, ej: http://localhost:8080/api/citas */
  private readonly urlBase = `${environment.apiUrl}/citas`;

  /**
   * Guarda temporalmente, en memoria, la cita que el usuario eligio
   * editar desde la lista. El backend no tiene un endpoint para consultar
   * una sola cita por id (solo filtrar, crear y actualizar), asi que el
   * formulario de edicion reutiliza los datos que ya se cargaron en la
   * lista, en vez de volver a pedirlos al servidor.
   */
  private citaSeleccionada: Cita | null = null;

  constructor(private http: HttpClient) { }

  /**
   * Guarda la cita elegida para editar, antes de navegar al formulario.
   *
   * @param cita cita seleccionada desde la lista
   */
  seleccionarParaEditar(cita: Cita): void {
    this.citaSeleccionada = cita;
  }

  /**
   * Devuelve la cita que se guardo con {@link seleccionarParaEditar}, o
   * null si el usuario entro directamente al formulario sin pasar por la
   * lista (por ejemplo, recargando la pagina).
   *
   * @return la cita seleccionada, o null si no hay ninguna
   */
  obtenerSeleccionada(): Cita | null {
    return this.citaSeleccionada;
  }

  /** Consulta una cita individual para permitir recargar el formulario de edición. */
  obtenerPorId(id: number): Observable<Cita> { return this.http.get<Cita>(`${this.urlBase}/${id}`); }

  /** Lista todas las citas para combos dependientes de historias y fórmulas. */
  listarTodas(): Observable<Cita[]> { return this.http.get<Cita[]>(this.urlBase); }

  /**
   * Filtra las citas entre una fecha inicial y una fecha final.
   * Corresponde a: GET /api/citas/filtrar?fechaInicio=...&fechaFin=...
   *
   * @param fechaInicio fecha y hora inicial, en formato ISO (ej: "2026-01-01T00:00:00")
   * @param fechaFin    fecha y hora final, en formato ISO
   * @return un Observable que emite las citas encontradas, de la mas reciente a la mas antigua
   */
  filtrarPorFecha(fechaInicio: string, fechaFin: string): Observable<Cita[]> {
    const parametros = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<Cita[]>(`${this.urlBase}/filtrar`, { params: parametros });
  }

  /**
   * Crea una nueva cita en el backend.
   * Corresponde a: POST /api/citas
   *
   * @param cita datos de la cita a crear
   * @return un Observable que emite la cita ya creada (con su id)
   */
  crear(cita: Cita): Observable<Cita> {
    return this.http.post<Cita>(this.urlBase, cita);
  }

  /**
   * Actualiza una cita existente en el backend.
   * Corresponde a: PUT /api/citas/{id}
   *
   * @param id   identificador de la cita a actualizar
   * @param cita nuevos datos de la cita
   * @return un Observable que emite la cita ya actualizada
   */
  actualizar(id: number, cita: Cita): Observable<Cita> {
    return this.http.put<Cita>(`${this.urlBase}/${id}`, cita);
  }
}
