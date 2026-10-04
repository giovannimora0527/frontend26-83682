import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FormulaMedica, FormulaMedicaPayload } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private readonly api = 'formula-medica';

  constructor(private readonly backendService: BackendService) {}

  /** Consulta todas las fórmulas médicas registradas. */
  listar(): Observable<FormulaMedica[]> {
    return this.backendService.get<FormulaMedica[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  /** Envía una fórmula nueva al backend. */
  crear(formula: FormulaMedicaPayload): Observable<FormulaMedica> {
    return this.backendService.post<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      formula
    );
  }

  /** Actualiza una fórmula existente usando su identificador. */
  actualizar(id: number, formula: FormulaMedicaPayload): Observable<FormulaMedica> {
    return this.backendService.put<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      formula
    );
  }
}
