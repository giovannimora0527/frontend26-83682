import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormulaMedica, FormulaMedicaRequest, PageResponse } from 'src/app/models/clinica';
import { BackendService } from 'src/app/services/backend.service';
import { queryParams } from 'src/app/services/query-params';
import { environment } from 'src/environments/environment';

export interface FiltroFormulas {
  page?: number; size?: number; sort?: string; direction?: 'ASC' | 'DESC';
  clienteId?: number; mascotaId?: number; veterinarioId?: number; medicamento?: string; fecha?: string;
}

@Injectable({ providedIn: 'root' })
export class FormulaMedicaService {
  private readonly resource = 'formulas-medicas';
  constructor(private readonly backend: BackendService) {}

  listar(filtros: FiltroFormulas = {}): Observable<PageResponse<FormulaMedica>> {
    const params: HttpParams = queryParams(filtros);
    return this.backend.get<PageResponse<FormulaMedica>>(environment.apiUrlAuth, this.resource, '', params).pipe(map(p => ({ ...p, content: (p.content ?? []).map(f => this.normalizar(f)) })));
  }
  consultar(id: number): Observable<FormulaMedica> {
    return this.backend.get<FormulaMedica>(environment.apiUrlAuth, this.resource, String(id)).pipe(map(f => this.normalizar(f)));
  }
  crear(formula: FormulaMedicaRequest): Observable<FormulaMedica> {
    return this.backend.post<FormulaMedica>(environment.apiUrlAuth, this.resource, '', formula);
  }
  actualizar(id: number, formula: FormulaMedicaRequest): Observable<FormulaMedica> {
    return this.backend.put<FormulaMedica>(environment.apiUrlAuth, this.resource, String(id), formula);
  }

  /** Mantiene compatibilidad con las pruebas y llamadas previas al módulo. */
  listarFormulas(asc = false): Observable<PageResponse<FormulaMedica>> {
    return this.listar({ page: 0, size: 20, sort: 'fechaCreacionRegistro', direction: asc ? 'ASC' : 'DESC' });
  }
  private normalizar(f: FormulaMedica): FormulaMedica {
    return { ...f, id: f.id ?? f.formulaMedicaId ?? f.formulaId ?? 0,
      mascotaId: f.mascotaId !== undefined ? f.mascotaId : f.mascota?.mascotaId ?? f.mascota?.id ?? f.historiaClinica?.mascotaId ?? null,
      veterinarioId: f.veterinarioId ?? f.veterinario?.id ?? f.historiaClinica?.veterinarioId ?? 0 };
  }
}
