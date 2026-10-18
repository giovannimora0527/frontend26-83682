
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
export interface Especializacion {

  // Identificador principal.
  id: number;

  // Nombre de la especialización.
  nombre: string;

  // Descripción; puede ser nula.
  descripcion: string | null;

  // Código único de especialización.
  codigoEspecializacion: string;
}

// 3. SERVICIO
@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {

  // Recurso del backend.
  private readonly api = 'especializacion';

  // Constructor con inyección del servicio HTTP.
  constructor(
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
