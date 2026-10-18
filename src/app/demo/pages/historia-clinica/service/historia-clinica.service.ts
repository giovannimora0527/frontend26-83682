import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnotacionClinica, AnotacionRequest, HistoriaClinica, HistoriaClinicaDetalle, HistoriaClinicaRequest, PageResponse } from 'src/app/models/clinica';
import { BackendService } from 'src/app/services/backend.service';
import { queryParams } from 'src/app/services/query-params';
import { environment } from 'src/environments/environment';

export interface FiltroHistorias {
  page?: number; size?: number; sort?: string; direction?: 'ASC' | 'DESC'; clienteId?: number; mascotaId?: number; veterinarioId?: number; fecha?: string;
}
export interface FiltroAnotaciones {
  page?: number; size?: number; sort?: string; direction?: 'ASC' | 'DESC'; historiaClinicaId?: number; veterinarioId?: number; fecha?: string;
}

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
  private readonly resource = 'historias-clinicas';
  constructor(private readonly backend: BackendService) {}

  listar(filtros: FiltroHistorias = {}): Observable<PageResponse<HistoriaClinica>> {
    const params: HttpParams = queryParams(filtros);
    return this.backend.get<PageResponse<HistoriaClinica>>(environment.apiUrlAuth, this.resource, '', params).pipe(map(p => ({ ...p, content: (p.content ?? []).map(h => this.normalizarHistoria(h)) })));
  }
  consultar(historiaClinicaId: number): Observable<HistoriaClinicaDetalle> {
    return this.backend.get<HistoriaClinicaDetalle>(environment.apiUrlAuth, this.resource, String(historiaClinicaId)).pipe(map(detalle => ({
      ...detalle,
      historia: this.normalizarHistoria(detalle.historia),
      anotaciones: {
        ...detalle.anotaciones,
        content: (detalle.anotaciones?.content ?? []).map(n => this.normalizarAnotacion(n))
      }
    })));
  }
  crear(historia: HistoriaClinicaRequest): Observable<HistoriaClinica> {
    return this.backend.post<HistoriaClinica>(environment.apiUrlAuth, this.resource, '', historia);
  }
  listarAnotaciones(id: number, page = 0, size = 20): Observable<PageResponse<AnotacionClinica>> {
    const params = queryParams({ page, size });
    return this.backend.get<PageResponse<AnotacionClinica>>(environment.apiUrlAuth, this.resource, `${id}/anotaciones`, params).pipe(map(p => ({ ...p, content: (p.content ?? []).map(n => this.normalizarAnotacion(n)) })));
  }
  crearAnotacion(anotacion: AnotacionRequest): Observable<AnotacionClinica> {
    return this.backend.post<AnotacionClinica>(environment.apiUrlAuth, 'anotaciones', '', anotacion);
  }
  listarTodasLasAnotaciones(filtros: FiltroAnotaciones = {}): Observable<PageResponse<AnotacionClinica>> {
    const params: HttpParams = queryParams(filtros);
    return this.backend.get<PageResponse<AnotacionClinica>>(environment.apiUrlAuth, 'anotaciones', '', params).pipe(map(p => ({ ...p, content: (p.content ?? []).map(n => this.normalizarAnotacion(n)) })));
  }
  consultarAnotacion(id: number): Observable<AnotacionClinica> {
    return this.backend.get<AnotacionClinica>(environment.apiUrlAuth, 'anotaciones', String(id)).pipe(map(n => this.normalizarAnotacion(n)));
  }

  private normalizarHistoria(h: HistoriaClinica): HistoriaClinica {
    return { ...h, id: h.id ?? h.historiaClinicaId ?? 0, clienteId: h.clienteId ?? h.cliente?.clienteId ?? h.cliente?.id ?? 0,
      mascotaId: h.mascotaId ?? h.mascota?.mascotaId ?? h.mascota?.id ?? 0, veterinarioId: h.veterinarioId ?? h.veterinario?.veterinarioId ?? h.veterinario?.id ?? 0 };
  }
  private normalizarAnotacion(n: AnotacionClinica): AnotacionClinica {
    return { ...n, id: n.id ?? n.anotacionId ?? 0, veterinarioId: n.veterinarioId ?? n.veterinario?.id ?? 0 };
  }
}
