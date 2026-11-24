
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// ==========================================================
// CLÍNICA VETERINARIA - UNIMINUTO
// SERVICIO DE MÉDICOS VETERINARIOS
// ==========================================================

// Modelo que representa los datos de cada médico.
import { Medico } from '../models/medico';

// Servicio general para comunicarse con Spring Boot.
import { BackendService } from './backend.service';

// Configuración de la URL principal del backend.
import { environment } from '../../environments/environment';

/**
 * ==========================================================
 * SERVICIO: MedicoService
 * ==========================================================
 *
 * Se encarga de consultar los médicos
 * registrados en la base de datos MySQL.
 *
 * Este servicio será utilizado en el
 * formulario de Gestión de Citas.
 *
 * Permitirá mostrar los nombres y apellidos
 * de los veterinarios en una lista desplegable.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  // ========================================================
  // 1. RECURSO PRINCIPAL DE LA API
  // ========================================================

  /**
   * Corresponde a la ruta /medico
   * definida en MedicoApi.java.
   */
  private readonly api = 'medico';

  // ========================================================
  // 2. CONSTRUCTOR
  // ========================================================

  /**
   * Inyectamos el servicio general que
   * realiza las peticiones HTTP.
   */
  constructor(
    private readonly backendService: BackendService
  ) {}

  // ========================================================
  // 3. CONSULTAR TODOS LOS MÉDICOS
  // ========================================================

  /**
   * Obtiene los médicos registrados en MySQL.
   *
   * Endpoint:
   * GET http://localhost:8080/clinica/v1/medico/listar
   *
   * El backend devuelve los médicos
   * ordenados por apellidos y nombres.
   *
   * @returns Observable con la lista de médicos.
   */
  listarMedicos(): Observable<Medico[]> {

    return this.backendService.get<Medico[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );

  }

}
