import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mascota } from 'src/app/models/mascota';
import { MascotaRq } from 'src/app/models/mascota-rq';
import { Respuesta } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private api = `mascota`;

  constructor(private backendService: BackendService) {

  }

  listarMascotas(): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-mascotas");
  }

  guardarMascota(mascota: MascotaRq): Observable<Respuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "guardar", mascota);
  }

  actualizarMascota(mascota: MascotaRq): Observable<Respuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", mascota);
  }
}
