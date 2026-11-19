import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Franja { dia: number; inicio: string; fin: string; }
export interface Ausencia { id?: number; inicio: string; fin: string; motivo: string; }
export interface HorarioMedico { activo: boolean; horarios: Franja[]; ausencias: Ausencia[]; }
export interface Intervalo { inicio: string; fin: string; }
export interface DisponibilidadMedica { fecha: string; activo: boolean; libres: Intervalo[]; }
export interface EventoMedico extends Intervalo {
  id: number;
  estado: string;
  medico: string;
  mascota: string | null;
  propietario: string;
  motivo: string | null;
}
export interface CambioCita { estado?: string; inicio?: string; fin?: string; }
export interface RevisionCita {
  id: number;
  usuarioId: number | null;
  fecha: string;
  anterior: Partial<EventoMedico> | null;
  actual: Partial<EventoMedico>;
}

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrlAuth + '/cita/agenda';

  eventos(desde: string, hasta: string, estado: string) {
    return this.http.get<EventoMedico[]>(this.api + '/mia', { params: this.rango(desde, hasta, estado) });
  }

  excel(desde: string, hasta: string, estado: string) {
    return this.http.get(this.api + '/mia/excel', { params: this.rango(desde, hasta, estado), responseType: 'blob' });
  }

  disponibilidad(medico: number, fecha: string) {
    return this.http.get<DisponibilidadMedica>(this.medico(medico) + '/disponibilidad', { params: { fecha } });
  }

  configuracion(medico: number | null) {
    return this.http.get<HorarioMedico>(this.medico(medico) + '/configuracion');
  }

  guardarHorarios(medico: number | null, franjas: Franja[]) {
    return this.http.put<HorarioMedico>(this.medico(medico) + '/horarios', franjas);
  }

  registrarAusencia(medico: number | null, ausencia: Ausencia) {
    return this.http.post<HorarioMedico>(this.medico(medico) + '/ausencias', ausencia);
  }

  actividad(medico: number, activo: boolean) {
    return this.http.put<void>(this.medico(medico) + '/actividad', { activo });
  }

  cambiar(id: number, cambio: CambioCita) {
    return this.http.put(this.api + '/' + id + '/cambio', cambio);
  }

  historial(id: number) {
    return this.http.get<RevisionCita[]>(this.api + '/' + id + '/historial');
  }

  private medico(medico: number | null) {
    return this.api + (medico === null ? '/mia' : '/medicos/' + medico);
  }

  private rango(desde: string, hasta: string, estado: string) {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (estado) params = params.set('estado', estado);
    return params;
  }
}

export function errorAgenda(error: { error?: { mensaje?: string; detail?: string } }) {
  return error.error?.mensaje ?? error.error?.detail ?? 'No se pudo completar la operación de agenda.';
}

export function hoyBogota() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date());
}
