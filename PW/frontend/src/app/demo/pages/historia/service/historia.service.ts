import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  private apiHistoria = 'anotacion-historia';
  private apiMascota = 'mascota';
  private apiMedico = 'medico';

  constructor(private backendService: BackendService) { }

  listarAnotaciones(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiHistoria, "listar");
  }

  crearAnotacion(anotacion: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.apiHistoria, "crear", anotacion);
  }

  listarMascotas(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiMascota, "listar");
  }

  listarMedicos(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiMedico, "listar");
  }
}