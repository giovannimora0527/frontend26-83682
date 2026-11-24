import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita, CitaRq, HistorialEstadoCita } from 'src/app/models/cita';
import { EstadoCita } from 'src/app/models/estados';
import { EventoCalendario, ResumenEstadosCita } from 'src/app/models/evento-calendario';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = `cita`;

  constructor(private readonly backendService: BackendService) { }

  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  listarCitasPorMascota(mascotaId: number): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-por-mascota', construirParams({ mascotaId }));
  }

  /** Antecedentes del paciente: citas de cualquier médico, con canceladas. */
  historialMascota(mascotaId: number): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `historial-mascota/${mascotaId}`);
  }

  historialEstados(citaId: number): Observable<HistorialEstadoCita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${citaId}/historial-estados`);
  }

  guardarCita(cita: CitaRq): Observable<RespuestaApi<Cita>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "crear", cita);
  }

  actualizarCita(cita: CitaRq): Observable<RespuestaApi<Cita>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", cita);
  }

  reprogramar(citaId: number, fechaInicio: string): Observable<RespuestaApi<Cita>> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${citaId}/reprogramar`, { fechaInicio });
  }

  cambiarEstado(citaId: number, estado: EstadoCita, motivo?: string): Observable<RespuestaApi<Cita>> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${citaId}/estado`, { estado, ...(motivo ? { motivo } : {}) });
  }

  calendario(desde: string, hasta: string): Observable<EventoCalendario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'calendario', construirParams({ desde, hasta }));
  }

  resumenEstados(desde: string, hasta: string): Observable<ResumenEstadosCita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'resumen-estados', construirParams({ desde, hasta }));
  }
}
