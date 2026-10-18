import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private api = 'mascota';

  constructor(private backendService: BackendService) {}

  listarMascotas(): Observable<Mascota[]> {
    return this.backendService
      .get<Mascota[]>(environment.apiUrlAuth, this.api, 'listar')
      .pipe(map((mascotas) => {
        if (!Array.isArray(mascotas)) {
          throw new Error('La respuesta de listar mascotas no es un arreglo JSON.');
        }
        return mascotas;
      }));
  }

  listarOrdenadas(ascendente = true): Observable<Mascota[]> {
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, this.api, 'listar-mascotas-ordenado',
      new HttpParams().set('ascendente', ascendente));
  }

  listarPorCliente(clienteId: number): Observable<Mascota[]> {
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, this.api, 'buscar-by-cliente',
      new HttpParams().set('clienteId', clienteId));
  }

  consultarMascota(id: number): Observable<Mascota> {
    return this.backendService.get<Mascota>(environment.apiUrlAuth, this.api, String(id));
  }

  crearMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'guardar', mascota);
  }

  actualizarMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'actualizar', mascota);
  }

  eliminarMascota(mascotaId: number): Observable<{ status: number; message: string }> {
    return this.backendService.delete<{ status: number; message: string }>(
      environment.apiUrlAuth,
      this.api,
      `eliminar/${mascotaId}`
    );
  }
}
