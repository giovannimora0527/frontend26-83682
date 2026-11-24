
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * SERVICIO DE ESPECIALIZACIONES
 * ==========================================================
 *
 * Permite consultar las especializaciones
 * almacenadas en MySQL mediante Spring Boot.
 */

// 1. IMPORTACIONES
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from './backend.service';
import { environment } from 'src/environments/environment';

// 2. MODELO DE ESPECIALIZACIÓN
// Coincide con el JSON devuelto por Spring Boot.
/** Modelo de datos «Especializacion» que se intercambia con el backend. */
export interface Especializacion {

  // Identificador principal.
  /** Identificador único del registro. */
  id: number;

  // Nombre de la especialización.
  /** Nombre. */
  nombre: string;

  // Descripción; puede ser nula.
  /** Descripción. */
  descripcion: string | null;

  // Código único de especialización.
  /** Código especialización. */
  codigoEspecializacion: string;
}

// 3. SERVICIO
/** Servicio de especialización: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {

  // Recurso del backend.
  /** Ruta del recurso en la API del backend. */
  private readonly api = 'especializacion';

  // Constructor con inyección del servicio HTTP.
  /**
   * Crea la instancia con sus dependencias inyectadas.
   *
   * @param backendService servicio backend.
   */
  constructor(
    /** Dependencia inyectada (BackendService). */
    private readonly backendService: BackendService
  ) {}

  /**
   * MÉTODO: LISTAR ESPECIALIZACIONES
   *
   * Endpoint:
   * GET /clinica/v1/especializacion/listar
   *
   * Devuelve las especializaciones
   * registradas en la base de datos.
   */
  listarEspecializaciones(): Observable<Especializacion[]> {

    return this.backendService.get<Especializacion[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );

  }

}
