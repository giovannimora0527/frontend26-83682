import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { FormulaMedica, FormulaMedicaPayload } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

// Cambiar a false para usar el backend en lugar de la simulación local.
export const MODO_DEMOSTRACION_FORMULAS = true;

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private readonly api = 'formula-medica';
  private formulasDemo: FormulaMedica[] = [
    {
      id: 1,
      medicamento: 'Medicamento de demostración',
      dosis: 'Dato de ejemplo',
      indicaciones: 'Información ficticia para presentación; no usar como prescripción.',
      fechaInicio: '2026-10-04',
      fechaFin: '2026-10-11',
      paciente: 'Paciente de ejemplo',
      medico: 'Profesional de ejemplo'
    }
  ];

  constructor(private readonly backendService: BackendService) {}

  /** Consulta todas las fórmulas médicas registradas. */
  listar(): Observable<FormulaMedica[]> {
    if (MODO_DEMOSTRACION_FORMULAS) {
      return of(this.formulasDemo.map((formula) => ({ ...formula })));
    }

    return this.backendService.get<FormulaMedica[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  /** Envía una fórmula nueva al backend. */
  crear(formula: FormulaMedicaPayload): Observable<FormulaMedica> {
    if (MODO_DEMOSTRACION_FORMULAS) {
      const id = Math.max(0, ...this.formulasDemo.map((registro) => registro.id ?? 0)) + 1;
      const nuevaFormula: FormulaMedica = { ...formula, id };
      this.formulasDemo = [...this.formulasDemo, nuevaFormula];
      return of({ ...nuevaFormula });
    }

    return this.backendService.post<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      formula
    );
  }

  /** Actualiza una fórmula existente usando su identificador. */
  actualizar(id: number, formula: FormulaMedicaPayload): Observable<FormulaMedica> {
    if (MODO_DEMOSTRACION_FORMULAS) {
      const indice = this.formulasDemo.findIndex((registro) => registro.id === id);
      if (indice === -1) {
        return throwError(() => new Error(`No existe la fórmula médica con ID ${id}.`));
      }

      const formulaActualizada: FormulaMedica = { ...formula, id };
      this.formulasDemo = this.formulasDemo.map((registro, posicion) =>
        posicion === indice ? formulaActualizada : registro
      );
      return of({ ...formulaActualizada });
    }

    return this.backendService.put<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      formula
    );
  }
}
