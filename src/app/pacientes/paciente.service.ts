import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paciente } from './paciente.model';

/**
 * Servicio encargado de comunicarse con el backend de Spring Boot para
 * todo lo relacionado con Pacientes.
 *
 * {@code @Injectable({ providedIn: 'root' })} hace que Angular cree una
 * unica instancia de este servicio para toda la aplicacion (singleton) y
 * que se pueda inyectar en cualquier componente sin tener que declararlo
 * en cada modulo.
 */
@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  /** Consulta una mascota por su identificador. */
  obtener(id: number): Observable<Paciente> { return this.http.get<Paciente>(`${this.urlBase}/${id}`); }

  /** URL base de los endpoints de paciente, ej: http://localhost:8080/api/pacientes */
  private readonly urlBase = `${environment.apiUrl}/pacientes`;

  /**
   * @param http cliente HTTP de Angular, usado para hacer las peticiones
   *             GET/POST/PUT/DELETE al backend.
   */
  constructor(private http: HttpClient) { }

  /**
   * Pide al backend la lista completa de pacientes.
   * Corresponde a: GET /api/pacientes
   *
   * @return un Observable que emite el arreglo de pacientes cuando el
   *         backend responde.
   */
  listar(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.urlBase);
  }

  /**
   * Crea un nuevo paciente en el backend.
   * Corresponde a: POST /api/pacientes
   *
   * @param paciente datos del paciente a crear (sin id)
   * @return un Observable que emite el paciente ya creado (con su id)
   */
  crear(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.urlBase, paciente);
  }
}
