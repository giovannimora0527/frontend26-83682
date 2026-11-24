
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO DE GESTIÓN DE RAZAS
 * ==========================================================
 *
 * Consulta las razas registradas en MySQL
 * utilizando el backend de Spring Boot.
 */

// ==========================================================
// 1. IMPORTACIONES
// ==========================================================

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Servicio general de peticiones HTTP.
import { BackendService } from './backend.service';

// Configuración de la dirección del backend.
import { environment } from '../../environments/environment';

// ==========================================================
// 2. MODELO DE RESPUESTA DE LA API
// ==========================================================

/**
 * Representa la información que devuelve
 * el endpoint GET /raza/listar.
 *
 * Se utiliza un modelo separado para no modificar
 * el modelo Raza que ya usa Gestión de Mascotas.
 */
export interface RazaRegistro {

  // Identificador de la raza.
  /** Identificador de raza. */
  razaId: number;

  // Nombre registrado.
  /** Nombre. */
  nombre: string;

  // Especie.
  /** Especie de la mascota. */
  especie: string;

  // Fecha de creación enviada por Spring Boot.
  /** Fecha creación. */
  fechaCreacion: string;

  // Fecha de última modificación.
  /** Fecha modificación. */
  fechaModificacion: string;
}

// ==========================================================
// 3. SERVICIO DE RAZAS
// ==========================================================

/** Servicio de raza: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({
  providedIn: 'root'
})
export class RazaService {

  // Recurso de la API.
  /** Ruta del recurso en la API del backend. */
  private readonly api = 'raza';

  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param backendService servicio backend.
   */
  constructor(
    /** Dependencia inyectada (BackendService). */
    private readonly backendService: BackendService
  ) {}

  // ========================================================
  // MÉTODO 1: LISTAR RAZAS
  // ========================================================

  /**
   * Consulta todas las razas registradas.
   *
   * Endpoint completo:
   *
   * GET http://localhost:8080/clinica/v1/raza/listar
   *
   * El resultado será una lista de objetos
   * de tipo RazaRegistro.
   */
  listarRazas(): Observable<RazaRegistro[]> {

    return this.backendService.get<RazaRegistro[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );

  }

}
