import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cita, CitaRequest, EstadoCita, PageResponse } from 'src/app/models/clinica';
import { BackendService } from 'src/app/services/backend.service';
import { queryParams } from 'src/app/services/query-params';
import { environment } from 'src/environments/environment';

export interface FiltroCitas {
  page?: number; size?: number; sort?: string; direction?: 'ASC' | 'DESC';
  clienteId?: number; mascotaId?: number; veterinarioId?: number; fecha?: string; estado?: EstadoCita | '';
}

@Injectable({ providedIn: 'root' })
export class CitaService {
  private readonly resource = 'citas';
  constructor(private readonly backend: BackendService) {}

  listar(filtros: FiltroCitas = {}): Observable<PageResponse<Cita>> {
    const params: HttpParams = queryParams(filtros);
    return this.backend.get<PageResponse<Cita>>(environment.apiUrlAuth, this.resource, '', params).pipe(map(page => ({ ...page, content: (page.content ?? []).map(c => this.normalizar(c)) })));
  }
  consultar(id: number): Observable<Cita> {
    return this.backend.get<Cita>(environment.apiUrlAuth, this.resource, String(id)).pipe(map(c => this.normalizar(c)));
  }
  crear(cita: CitaRequest): Observable<Cita> {
    return this.backend.post<Cita>(environment.apiUrlAuth, this.resource, '', cita);
  }
  actualizar(id: number, cita: CitaRequest): Observable<Cita> {
    return this.backend.put<Cita>(environment.apiUrlAuth, this.resource, String(id), cita);
  }
  private normalizar(c: Cita): Cita {
    const fechaHora = c.fechaHora ?? '';
    return { ...c, id: c.id ?? c.citaId ?? 0,
      clienteId: c.clienteId ?? c.cliente?.clienteId ?? c.cliente?.id ?? 0,
      mascotaId: c.mascotaId ?? c.mascota?.mascotaId ?? c.mascota?.id ?? 0,
      veterinarioId: c.veterinarioId ?? c.veterinario?.veterinarioId ?? c.veterinario?.id ?? c.medico?.veterinarioId ?? c.medico?.id ?? 0,
      fecha: c.fecha ?? fechaHora.slice(0, 10), hora: c.hora ?? fechaHora.slice(11, 19),
      motivoConsulta: c.motivoConsulta ?? c.motivo ?? '' };
  }
}
