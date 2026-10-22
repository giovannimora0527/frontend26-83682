
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO DE FÓRMULAS MÉDICAS
 * ==========================================================
 *
 * Permite conectar Angular con el backend Spring Boot.
 *
 * Endpoint:
 * GET /formula-medica/listar-todos
 *
 * Este servicio consultará las fórmulas médicas
 * registradas en la base de datos MySQL.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

// Permite crear servicios en Angular.
import { Injectable } from '@angular/core';

// Permite realizar solicitudes HTTP.
import { HttpClient } from '@angular/common/http';

// Permite trabajar con respuestas asíncronas.
import { Observable } from 'rxjs';

// Modelo de fórmulas médicas.
import { FormulaMedica } from '../models/formula-medica';

// ==========================================================
// 2. CONFIGURACIÓN DEL SERVICIO
// ==========================================================

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {

  // ========================================================
  // 3. DIRECCIÓN DEL BACKEND
  // ========================================================

  // Dirección de Spring Boot en desarrollo local.
  private readonly apiUrl =
    'http://localhost:8080/clinica/v1/formula-medica';

  // ========================================================
  // 4. CONSTRUCTOR
  // ========================================================

  /**
   * Inyecta HttpClient para realizar
   * solicitudes HTTP al backend.
   */
  constructor(
    private http: HttpClient
  ) {}

  // ========================================================
  // 5. LISTAR FÓRMULAS MÉDICAS
  // ========================================================

  /**
   * Consulta todas las fórmulas médicas
   * registradas en MySQL.
   *
   * Método HTTP: GET
   *
   * Ruta completa:
   * http://localhost:8080/clinica/v1/
   * formula-medica/listar-todos
   *
   * @returns Observable con la lista de fórmulas.
   */
  listarFormulasMedicas(): Observable<FormulaMedica[]> {

    return this.http.get<FormulaMedica[]>(
      `${this.apiUrl}/listar-todos`
    );

  }
/**
 * Consulta una fórmula médica por su ID.
 */
consultarFormula(id: number): Observable<FormulaMedica> {
  return this.http.get<FormulaMedica>(
    `${this.apiUrl}/consultar/${id}`
  );
}

/**
 * Registra una nueva fórmula médica.
 */
crearFormula(
  formula: Partial<FormulaMedica>
): Observable<FormulaMedica> {

  return this.http.post<FormulaMedica>(
    `${this.apiUrl}/crear`,
    formula
  );
}

/**
 * Actualiza una fórmula médica existente.
 */
actualizarFormula(
  id: number,
  formula: Partial<FormulaMedica>
): Observable<FormulaMedica> {

  return this.http.put<FormulaMedica>(
    `${this.apiUrl}/actualizar/${id}`,
    formula
  );
}
}
