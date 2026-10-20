
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO DE ANOTACIONES DE HISTORIAS MÉDICAS
 * ==========================================================
 *
 * Funcionalidades:
 *
 * 1. Conectar Angular con Spring Boot.
 * 2. Consultar todas las anotaciones médicas.
 * 3. Recibir los registros almacenados en MySQL.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

// Permite registrar el servicio en Angular.
import { Injectable } from '@angular/core';

// Permite realizar peticiones HTTP al backend.
import { HttpClient } from '@angular/common/http';

// Permite manejar respuestas asíncronas.
import { Observable } from 'rxjs';

// Modelo de anotaciones médicas.
import { AnotacionHistoria } from '../models/anotacion-historia';

// ==========================================================
// 2. CONFIGURACIÓN DEL SERVICIO
// ==========================================================

@Injectable({
  providedIn: 'root'
})

// ==========================================================
// 3. CLASE DEL SERVICIO
// ==========================================================

export class AnotacionHistoriaService {

  // ========================================================
  // 4. DIRECCIÓN DEL BACKEND SPRING BOOT
  // ========================================================

  // Ruta principal de la API REST de anotaciones.
  private readonly apiUrl =
    'http://localhost:8080/clinica/v1/anotacion-historia';

  // ========================================================
  // 5. CONSTRUCTOR
  // ========================================================

  // Angular proporciona HttpClient automáticamente
  // mediante su configuración existente.

  constructor(
    private http: HttpClient
  ) {}

  // ========================================================
  // 6. CONSULTAR TODAS LAS ANOTACIONES MÉDICAS
  // ========================================================

  /**
   * Obtiene todas las anotaciones de historias médicas.
   *
   * Método HTTP: GET
   *
   * Endpoint:
   * /anotacion-historia/listar-todos
   *
   * @returns Lista de anotaciones médicas.
   */

  listarAnotaciones(): Observable<AnotacionHistoria[]> {

    return this.http.get<AnotacionHistoria[]>(
      `${this.apiUrl}/listar-todos`
    );

  }

}
