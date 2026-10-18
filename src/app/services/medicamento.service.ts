
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO HTTP DE MEDICAMENTOS
 * ==========================================================
 *
 * Este servicio permite consultar los medicamentos
 * registrados en la base de datos MySQL.
 *
 * Angular se comunica con Spring Boot mediante HTTP.
 *
 * Endpoint:
 * GET http://localhost:8080/clinica/v1/medicamento/listar
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

// Permite registrar el servicio en Angular.
import { Injectable } from '@angular/core';

// Permite realizar peticiones HTTP.
import { HttpClient } from '@angular/common/http';

// Permite trabajar con respuestas asíncronas.
import { Observable } from 'rxjs';

// Modelo que representa un medicamento.
import { Medicamento } from '../models/medicamento';

// ==========================================================
// 2. CONFIGURACIÓN DEL SERVICIO
// ==========================================================

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  // ========================================================
  // 3. DIRECCIÓN DEL BACKEND
  // ========================================================

  /**
   * Dirección de la API de medicamentos.
   *
   * Spring Boot utiliza el puerto 8080.
   * Angular utiliza el puerto 4200.
   */
  private readonly apiUrl =
    'http://localhost:8080/clinica/v1/medicamento';

  // ========================================================
  // 4. CONSTRUCTOR
  // ========================================================

  /**
   * HttpClient permite realizar solicitudes
   * desde Angular hacia Spring Boot.
   */
  constructor(
    private readonly http: HttpClient
  ) {}

  // ========================================================
  // 5. LISTAR MEDICAMENTOS
  // ========================================================

  /**
   * Consulta todos los medicamentos registrados
   * en la tabla medicamento de MySQL.
   *
   * Ruta utilizada:
   * GET /medicamento/listar
   *
   * Retorna un Observable con una lista
   * de objetos del modelo Medicamento.
   */
  listarMedicamentos(): Observable<Medicamento[]> {

    // Construir la dirección del endpoint.
    const url = `${this.apiUrl}/listar`;

    // Ejecutar la petición GET.
    return this.http.get<Medicamento[]>(url);

  }

}
