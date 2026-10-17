import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private readonly api = 'mascota';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Obtiene las mascotas registradas en la API.
   * @returns Lista de mascotas con sus relaciones.
   */
  listarMascotas(): Observable<Mascota[]> {
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, this.api, 'listar-mascotas');
  }

  /**
   * Registra una mascota usando los identificadores de sus relaciones.
   * @param mascota Mascota y relaciones seleccionadas en el formulario.
   * @returns Mascota creada por el backend.
   */
  guardarMascota(mascota: Mascota): Observable<Mascota> {
    return this.backendService.post<Mascota>(
      environment.apiUrlAuth,
      this.api,
      'guardar',
      this.toRequest(mascota)
    );
  }

  /**
   * Actualiza una mascota enviando las claves foráneas que espera la API.
   * @param mascota Mascota editada en el formulario.
   * @returns Confirmación o registro actualizado por el backend.
   */
  actualizarMascota(mascota: Mascota): Observable<Mascota> {
    return this.backendService.post<Mascota>(
      environment.apiUrlAuth,
      this.api,
      'actualizar',
      this.toRequest(mascota)
    );
  }

  eliminarMascota(id: number): Observable<void> {
    return this.backendService.delete<void>(environment.apiUrlAuth, this.api, id);
  }

  /**
   * Convierte las relaciones completas del modelo de pantalla a IDs para la API.
   * @param mascota Modelo usado por el formulario.
   * @returns Cuerpo de la solicitud del backend.
   */
  private toRequest(mascota: Mascota): MascotaRequest {
    return {
      ...(mascota.mascotaId === undefined ? {} : { mascotaId: mascota.mascotaId }),
      nombreMascota: mascota.nombreMascota,
      edad: mascota.edad,
      ...(mascota.fechaRegistro === undefined ? {} : { fechaRegistro: mascota.fechaRegistro }),
      ...(mascota.fechaModificacion === undefined
        ? {}
        : { fechaModificacion: mascota.fechaModificacion }),
      razaId: mascota.raza?.razaId ?? null,
      clienteId: mascota.cliente?.clienteId ?? null
    };
  }
}

/**
 * Contrato que reciben los endpoints de creación y actualización de mascotas.
 */
interface MascotaRequest {
  mascotaId?: number;
  nombreMascota?: string;
  edad?: number;
  fechaRegistro?: Date;
  fechaModificacion?: Date;
  razaId: number | null;
  clienteId: number | null;
}
