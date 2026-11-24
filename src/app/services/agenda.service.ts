import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Modelo de datos «Franja» que se intercambia con el backend. */
export interface Franja { dia: number; inicio: string; fin: string; }
/** Modelo de datos «Ausencia» que se intercambia con el backend. */
export interface Ausencia { id?: number; inicio: string; fin: string; motivo: string; }
/** Modelo de datos «HorarioMedico» que se intercambia con el backend. */
export interface HorarioMedico { activo: boolean; horarios: Franja[]; ausencias: Ausencia[]; }
/** Modelo de datos «Intervalo» que se intercambia con el backend. */
export interface Intervalo { inicio: string; fin: string; }
/** Modelo de datos «DisponibilidadMedica» que se intercambia con el backend. */
export interface DisponibilidadMedica { fecha: string; activo: boolean; libres: Intervalo[]; }
/** Modelo de datos «EventoMedico» que se intercambia con el backend. */
export interface EventoMedico extends Intervalo {
  /** Identificador único del registro. */
  id: number;
  /** Estado actual del registro. */
  estado: string;
  /** Médico. */
  medico: string;
  /** Mascota. */
  mascota: string | null;
  /** Identificador de mascota (opcional). */
  mascotaId?: number;
  /** Propietario. */
  propietario: string;
  /** Motivo registrado. */
  motivo: string | null;
}
/** Modelo de datos «CambioCita» que se intercambia con el backend. */
export interface CambioCita { estado?: string; inicio?: string; fin?: string; }
/** Modelo de datos «RevisionCita» que se intercambia con el backend. */
export interface RevisionCita {
  /** Identificador único del registro. */
  id: number;
  /** Identificador de usuario. */
  usuarioId: number | null;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Anterior. */
  anterior: Partial<EventoMedico> | null;
  /** Actual. */
  actual: Partial<EventoMedico>;
}

/** Modelo de datos «CitaAnterior» que se intercambia con el backend. */
export interface CitaAnterior extends Intervalo {
  /** Identificador único del registro. */
  id: number;
  /** Médico. */
  medico: string;
  /** Estado actual del registro. */
  estado: string;
  /** Identificador de atención. */
  atencionId: number | null;
}

/** Servicio de agenda: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** Ruta del recurso en la API del backend. */
  private readonly api = environment.apiUrlAuth + '/cita/agenda';

  /**
   * Eventos mediante la API del backend.
   *
   * @param desde fecha inicial.
   * @param hasta fecha final.
   * @param estado estado a aplicar.
   * @returns observable con la respuesta del backend.
   */
  eventos(desde: string, hasta: string, estado: string) {
    return this.http.get<EventoMedico[]>(this.api + '/mia', { params: this.rango(desde, hasta, estado) });
  }

  /**
   * Descarga el Excel agenda mediante la API del backend.
   *
   * @param desde fecha inicial.
   * @param hasta fecha final.
   * @param estado estado a aplicar.
   * @returns observable con la respuesta del backend.
   */
  excel(desde: string, hasta: string, estado: string) {
    return this.http.get(this.api + '/mia/excel', { params: this.rango(desde, hasta, estado), responseType: 'blob' });
  }

  /**
   * Consulta la disponibilidad mediante la API del backend.
   *
   * @param medico médico.
   * @param fecha fecha (AAAA-MM-DD).
   * @returns observable con la respuesta del backend.
   */
  disponibilidad(medico: number, fecha: string) {
    return this.http.get<DisponibilidadMedica>(this.medico(medico) + '/disponibilidad', { params: { fecha } });
  }

  /**
   * Consulta la configuración mediante la API del backend.
   *
   * @param medico médico.
   * @returns observable con la respuesta del backend.
   */
  configuracion(medico: number | null) {
    return this.http.get<HorarioMedico>(this.medico(medico) + '/configuracion');
  }

  /**
   * Guarda horarios mediante la API del backend.
   *
   * @param medico médico.
   * @param franjas franjas.
   * @returns observable con la respuesta del backend.
   */
  guardarHorarios(medico: number | null, franjas: Franja[]) {
    return this.http.put<HorarioMedico>(this.medico(medico) + '/horarios', franjas);
  }

  /**
   * Registra ausencia mediante la API del backend.
   *
   * @param medico médico.
   * @param ausencia ausencia.
   * @returns observable con la respuesta del backend.
   */
  registrarAusencia(medico: number | null, ausencia: Ausencia) {
    return this.http.post<HorarioMedico>(this.medico(medico) + '/ausencias', ausencia);
  }

  /**
   * Cambia la actividad mediante la API del backend.
   *
   * @param medico médico.
   * @param activo activo.
   * @returns observable con la respuesta del backend.
   */
  actividad(medico: number, activo: boolean) {
    return this.http.put<void>(this.medico(medico) + '/actividad', { activo });
  }

  /**
   * Cambia agenda mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param cambio cambio.
   * @returns observable con la respuesta del backend.
   */
  cambiar(id: number, cambio: CambioCita) {
    return this.http.put(this.api + '/' + id + '/cambio', cambio);
  }

  /**
   * Consulta el historial mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  historial(id: number) {
    return this.http.get<RevisionCita[]>(this.api + '/' + id + '/historial');
  }

  /**
   * Consulta el historial de mascota mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param pagina número de página.
   * @returns observable con la respuesta del backend.
   */
  historialMascota(id: number, pagina: number) {
    return this.http.get<{ citas: CitaAnterior[]; hayMas: boolean }>(
      environment.apiUrlAuth + '/cita/mascotas/' + id + '/historial', { params: { pagina } });
  }

  /**
   * Médico mediante la API del backend.
   *
   * @param medico médico.
   * @returns observable con la respuesta del backend.
   */
  private medico(medico: number | null) {
    return this.api + (medico === null ? '/mia' : '/medicos/' + medico);
  }

  /**
   * Rango.
   *
   * @param desde fecha inicial.
   * @param hasta fecha final.
   * @param estado estado a aplicar.
   */
  private rango(desde: string, hasta: string, estado: string) {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (estado) params = params.set('estado', estado);
    return params;
  }
}

/**
 * Error agenda.
 *
 * @param error error recibido del backend.
 */
export function errorAgenda(error: { error?: { mensaje?: string; detail?: string } }) {
  return error.error?.mensaje ?? error.error?.detail ?? 'No se pudo completar la operación de agenda.';
}

/** Hoy bogota. */
export function hoyBogota() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date());
}
