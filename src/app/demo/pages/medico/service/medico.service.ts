import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Medico } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Datos que se envían a POST /veterinarios y PUT /veterinarios/{id} (columnas de la tabla medico). */
export interface MedicoRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  registroProfesional: string;
  especializacionId: number;
}

@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  private api = 'veterinarios';

  constructor(private readonly backendService: BackendService) { }


  listar(): Observable<Medico[]> {
    return this.backendService.get<Medico[]>(environment.apiUrlAuth, this.api, '').pipe(
      map(medicos => medicos.map(medico => this.normalizar(medico)))
    );
  }

  consultar(id: number): Observable<Medico> {
    return this.backendService.get<Medico>(environment.apiUrlAuth, this.api, String(id)).pipe(
      map(medico => this.normalizar(medico))
    );
  }

  crear(medico: MedicoRequest): Observable<Medico> {
    return this.backendService.post<Medico>(environment.apiUrlAuth, this.api, '', medico).pipe(
      map(creado => this.normalizar(creado))
    );
  }

  actualizar(id: number, medico: MedicoRequest): Observable<Medico> {
    return this.backendService.put<Medico>(environment.apiUrlAuth, this.api, String(id), medico).pipe(
      map(actualizado => this.normalizar(actualizado))
    );
  }

  listarEspecializaciones(): Observable<Especializacion[]> {
    return this.backendService.get<Especializacion[]>(environment.apiUrlAuth, 'especializaciones', '');
  }

  /** Maps the API identifier to `id` while preserving `veterinarioId` for API payloads. */
  private normalizar(medico: Medico): Medico {
    const veterinarioId = medico.veterinarioId ?? medico.id;
    return { ...medico, id: veterinarioId, veterinarioId };
  }
}
