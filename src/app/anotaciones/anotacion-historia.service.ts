import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnotacionHistoria } from './anotacion-historia.model';

/**
 * Servicio encargado de comunicarse con el backend para los servicios de
 * Anotacion de Historia Medica: crear, listar y actualizar (segun el
 * Requerimiento 5 del backend, no se pide eliminar).
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {

  /** URL base de los endpoints de anotacion. */
  private readonly urlBase = `${environment.apiUrl}/anotaciones`;

  /**
   * Guarda temporalmente, en memoria, la anotacion que el usuario eligio
   * editar desde la lista. El backend no tiene un endpoint para consultar
   * una sola anotacion por id (solo crear, listar por historia y
   * actualizar), asi que el formulario de edicion reutiliza los datos que
   * ya se cargaron en la lista.
   */
  private anotacionSeleccionada: AnotacionHistoria | null = null;

  constructor(private http: HttpClient) { }

  /**
   * Guarda la anotacion elegida para editar, antes de navegar al formulario.
   *
   * @param anotacion anotacion seleccionada desde la lista
   */
  seleccionarParaEditar(anotacion: AnotacionHistoria): void {
    this.anotacionSeleccionada = anotacion;
  }

  /**
   * Devuelve la anotacion que se guardo con {@link seleccionarParaEditar},
   * o null si el usuario entro directamente al formulario.
   *
   * @return la anotacion seleccionada, o null si no hay ninguna
   */
  obtenerSeleccionada(): AnotacionHistoria | null {
    return this.anotacionSeleccionada;
  }

  /**
   * Lista las anotaciones de una historia medica especifica.
   * Corresponde a: GET /api/anotaciones/historia/{historiaMedicaId}
   *
   * @param historiaMedicaId id de la historia medica
   * @return un Observable que emite las anotaciones de esa historia
   */
  listarPorHistoria(historiaMedicaId: number): Observable<AnotacionHistoria[]> {
    return this.http.get<AnotacionHistoria[]>(`${this.urlBase}/historia/${historiaMedicaId}`);
  }

  /**
   * Crea una nueva anotacion dentro de una historia medica.
   * Corresponde a: POST /api/anotaciones
   *
   * @param anotacion datos de la anotacion a crear
   * @return un Observable que emite la anotacion ya creada
   */
  crear(anotacion: AnotacionHistoria): Observable<AnotacionHistoria> {
    return this.http.post<AnotacionHistoria>(this.urlBase, anotacion);
  }

  /**
   * Actualiza una anotacion existente.
   * Corresponde a: PUT /api/anotaciones/{id}
   *
   * @param id        identificador de la anotacion a actualizar
   * @param anotacion nuevos datos de la anotacion
   * @return un Observable que emite la anotacion ya actualizada
   */
  actualizar(id: number, anotacion: AnotacionHistoria): Observable<AnotacionHistoria> {
    return this.http.put<AnotacionHistoria>(`${this.urlBase}/${id}`, anotacion);
  }
}
