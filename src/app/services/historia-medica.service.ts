
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO DE HISTORIAS MÉDICAS
 * ==========================================================
 *
 * Funciones:
 *
 * 1. Consultar todas las historias médicas.
 * 2. Consultar historias médicas por paciente.
 * 3. Conectar Angular con Spring Boot.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

// Permite registrar el servicio en Angular.
import { Injectable } from '@angular/core';

// Permite realizar solicitudes HTTP al backend.
import { HttpClient } from '@angular/common/http';

// Permite manejar respuestas asíncronas.
import { Observable } from 'rxjs';

// Modelo de historias médicas.
import { HistoriaMedica } from '../models/historia-medica';

// ==========================================================
// 2. CONFIGURACIÓN DEL SERVICIO
// ==========================================================

@Injectable({
  providedIn: 'root'
})

// ==========================================================
// 3. CLASE DEL SERVICIO
// ==========================================================

export class HistoriaMedicaService {

  // ========================================================
  // 4. URL DEL BACKEND SPRING BOOT
  // ========================================================

  private readonly apiUrl =
    'http://localhost:8080/clinica/v1/historia-medica';

  // ========================================================
  // 5. CONSTRUCTOR
  // ========================================================

  constructor(
    private http: HttpClient
  ) {}

  // ========================================================
  // 6. CONSULTAR TODAS LAS HISTORIAS MÉDICAS
  // ========================================================

  /**
   * Obtiene las historias médicas registradas
   * en la base de datos MySQL.
   *
   * GET /historia-medica/listar-todos
   */

  listarHistoriasMedicas(): Observable<HistoriaMedica[]> {

    return this.http.get<HistoriaMedica[]>(
      `${this.apiUrl}/listar-todos`
    );

  }

  // ========================================================
  // 7. CONSULTAR HISTORIAS POR PACIENTE
  // ========================================================

  /**
   * Consulta las historias médicas asociadas
   * al identificador de un paciente.
   *
   * @param pacienteId Identificador del paciente.
   *
   * GET /historia-medica/listar-por-paciente/1
   */

  listarHistoriasPorPaciente(
    pacienteId: number
  ): Observable<HistoriaMedica[]> {

    return this.http.get<HistoriaMedica[]>(
      `${this.apiUrl}/listar-por-paciente/${pacienteId}`
    );

  }

}
