
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Modelo utilizado para mostrar mascotas.
import { Mascota } from 'src/app/models/mascota';

// Servicio general de comunicación con Spring Boot.
import { BackendService } from 'src/app/services/backend.service';

// Dirección principal de nuestra API.
import { environment } from 'src/environments/environment';

/**
 * Datos que Angular enviará para crear una mascota.
 *
 * Deben coincidir con CrearMascotaDTO.java
 * que creamos en Spring Boot.
 */
export interface CrearMascotaDTO {

  // Nombre de la mascota.
  nombreMascota: string;

  // Edad en años.
  edad: number;

  // Identificador de la raza.
  razaId: number;

  // Identificador del propietario.
  clienteId: number;
}

/**
 * Servicio de gestión de mascotas.
 *
 * Se encarga de comunicarse con Spring Boot
 * para consultar y registrar mascotas.
 */
@Injectable({
  providedIn: 'root'
})
export class MascotaService {

  // Recurso principal de la API.
  private readonly api = 'mascota';

  constructor(
    private readonly backendService: BackendService
  ) {}

  /**
   * MÉTODO 1: LISTAR MASCOTAS.
   *
   * Recupera las mascotas con:
   * - Nombre
   * - Edad
   * - Fecha de registro
   * - Raza
   * - Especie
   * - Propietario
   *
   * Endpoint:
   * GET /clinica/v1/mascota/listar-detalle
   */
  listarMascotas(): Observable<Mascota[]> {

    return this.backendService.get<Mascota[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-detalle'
    );
  }

  /**
   * MÉTODO 2: GUARDAR MASCOTA.
   *
   * Envía los datos mediante una petición POST
   * al backend de Spring Boot.
   *
   * Endpoint:
   * POST /clinica/v1/mascota/crear
   *
   * El backend:
   * 1. Valida los datos.
   * 2. Comprueba la raza y el propietario.
   * 3. Asigna la fecha de registro.
   * 4. Guarda la mascota en MySQL.
   *
   * Devuelve la mascota recién registrada.
   */
  crearMascota(
    datos: CrearMascotaDTO
  ): Observable<Mascota> {

    return this.backendService.post<Mascota>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      datos
    );
  }
}
